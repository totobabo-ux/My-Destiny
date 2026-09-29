"use client";

import Link from "next/link";
import { useState } from "react";
import { shareUrl } from "@/lib/share";
import type { Pillar } from "@/lib/saju/calc";
import {
  ELEMENT_HEX,
  ELEMENT_KO,
  GAN,
  GAN_ELEMENT,
  GAN_KO,
  GAN_YANG,
  ZHI,
  ZHI_ELEMENT,
  ZHI_KO,
  zhiMainGan,
} from "@/lib/saju/constants";
import { useProfiles } from "@/lib/profiles";

/** 오행 색으로 칠한 천간/지지 한 글자 */
export function Char({ gan, zhi, size = "lg" }: { gan?: number; zhi?: number; size?: "sm" | "lg" }) {
  const isGan = gan !== undefined;
  const idx = (isGan ? gan : zhi)!;
  const el = isGan ? GAN_ELEMENT[idx] : ZHI_ELEMENT[idx];
  const hanja = isGan ? GAN[idx] : ZHI[idx];
  const ko = isGan ? GAN_KO[idx] : ZHI_KO[idx];
  // 지지 음양은 십신 계산과 같이 본기 기준 (子·午 음, 巳·亥 양)
  const yang = GAN_YANG(isGan ? idx : zhiMainGan(idx));
  const dim = size === "lg" ? "h-16 w-16 text-3xl sm:h-20 sm:w-20 sm:text-4xl" : "h-10 w-10 text-lg";
  return (
    <div
      className={`${dim} flex flex-col items-center justify-center rounded-xl font-serif font-bold text-white shadow-sm`}
      style={{ background: ELEMENT_HEX[el] }}
      title={`${ko} · ${yang ? "양" : "음"}${ELEMENT_KO[el]}`}
    >
      <span className="leading-none">{hanja}</span>
      {size === "lg" && (
        <span className="mt-1 font-sans text-[11px] font-medium opacity-90">
          {ko} · {yang ? "+" : "-"}{ELEMENT_KO[el]}
        </span>
      )}
    </div>
  );
}

export function PillarTable({ pillars }: { pillars: Pillar[] }) {
  // 전통 표기 순서: 시 → 일 → 월 → 년 (오른쪽에서 왼쪽으로 읽음)
  const cols = [...pillars].reverse();
  const row = "grid gap-2 text-center" as const;
  const style = { gridTemplateColumns: `4.5rem repeat(${cols.length}, minmax(0, 1fr))` };
  return (
    <div className="space-y-2 overflow-x-auto">
      <div className={row} style={style}>
        <Label />
        {cols.map((p) => (
          <div key={p.key} className={`text-sm font-bold ${p.key === "day" ? "text-accent" : ""}`}>{p.label}</div>
        ))}
      </div>
      <div className={row} style={style}>
        <Label>십신</Label>
        {cols.map((p) => <div key={p.key} className="text-sm">{p.ganGod === "일간" ? "나(일간)" : p.ganGod}</div>)}
      </div>
      <div className={row} style={style}>
        <Label>천간</Label>
        {cols.map((p) => <div key={p.key} className="flex justify-center"><Char gan={p.gan} /></div>)}
      </div>
      <div className={row} style={style}>
        <Label>지지</Label>
        {cols.map((p) => <div key={p.key} className="flex justify-center"><Char zhi={p.zhi} /></div>)}
      </div>
      <div className={row} style={style}>
        <Label>십신</Label>
        {cols.map((p) => <div key={p.key} className="text-sm">{p.zhiGod}</div>)}
      </div>
      <div className={`${row} border-t border-line pt-2`} style={style}>
        <Label>지장간</Label>
        {cols.map((p) => (
          <div key={p.key} className="text-xs text-muted">
            {p.hidden.map((h) => GAN_KO[h.gan]).join(" ")}
          </div>
        ))}
      </div>
      <div className={row} style={style}>
        <Label>12운성</Label>
        {cols.map((p) => <div key={p.key} className="text-xs">{p.stage}</div>)}
      </div>
      <div className={row} style={style}>
        <Label>납음</Label>
        {cols.map((p) => <div key={p.key} className="text-xs text-muted">{p.nayin}</div>)}
      </div>
    </div>
  );
}

function Label({ children }: { children?: React.ReactNode }) {
  return <div className="flex items-center text-xs text-muted">{children}</div>;
}

export function ElementBars({ elements, highlight }: { elements: number[]; highlight?: number }) {
  const max = Math.max(...elements, 1);
  return (
    <div className="space-y-2">
      {elements.map((n, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <span className="w-12 shrink-0 font-bold" style={{ color: ELEMENT_HEX[i] }}>
            {ELEMENT_KO[i]}
            {highlight === i && <span className="ml-0.5 text-[10px] text-gold">★</span>}
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: ELEMENT_HEX[i] }} />
          </div>
          <span className="w-8 text-right tabular-nums text-muted">{n}</span>
        </div>
      ))}
    </div>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "var(--accent)" : score >= 58 ? "var(--gold)" : "var(--muted)";
  return (
    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
    </div>
  );
}

/** 현재 선택된 프로필을 바꿀 수 있는 선택 바. 프로필이 없으면 안내 문구를 보여준다. */
export function ProfileBar() {
  const { profiles, activeId, setActive, hydrated } = useProfiles();
  if (!hydrated) return <div className="h-11" />;
  if (!profiles.length) return <NeedProfile />;
  return (
    <div className="mb-6 flex items-center gap-2">
      <select className="input" value={activeId ?? ""} onChange={(e) => setActive(e.target.value)} aria-label="프로필 선택">
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} · {p.calendar === "solar" ? "양" : p.leapMonth ? "윤" : "음"} {p.year}.{p.month}.{p.day}
            {p.hour !== null ? ` ${String(p.hour).padStart(2, "0")}:${String(p.minute ?? 0).padStart(2, "0")}` : " (시간 모름)"}
          </option>
        ))}
      </select>
      <Link href="/?new=1" className="btn btn-ghost shrink-0 text-sm">+ 추가</Link>
    </div>
  );
}

export function NeedProfile() {
  return (
    <div className="card text-center">
      <p className="mb-3 text-muted">먼저 생년월일 정보를 입력해 주세요.</p>
      <Link href="/?new=1" className="btn">정보 입력하기</Link>
    </div>
  );
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-serif text-xl font-bold">{children}</h2>
      {sub && <p className="text-sm text-muted">{sub}</p>}
    </div>
  );
}

/** 현재 사이트 주소 + path를 공유(모바일) 또는 복사(데스크톱) */
export function ShareButton({ path, title, label = "공유" }: { path: string; title: string; label?: string }) {
  const [msg, setMsg] = useState("");
  return (
    <span className="relative">
      <button
        className="btn btn-ghost px-3 py-1 text-sm"
        onClick={async () => {
          const m = await shareUrl(window.location.origin + path, title);
          if (m) {
            setMsg(m);
            setTimeout(() => setMsg(""), 2000);
          }
        }}
      >
        {label}
      </button>
      {msg && (
        <span className="absolute top-full right-0 z-10 mt-1 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs text-bg">{msg}</span>
      )}
    </span>
  );
}
