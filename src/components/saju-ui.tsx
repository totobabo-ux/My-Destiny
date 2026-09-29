"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { shareUrl } from "@/lib/share";
import type { Pillar } from "@/lib/saju/calc";
import {
  type TenGod,
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
import { GLOSSARY, STAGE_EASY, TEN_GOD_EASY } from "@/lib/saju/glossary";
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
          <div key={p.key} className={`text-sm font-bold ${p.key === "day" ? "text-accent" : ""}`}><Term word={p.label} /></div>
        ))}
      </div>
      <div className={row} style={style}>
        <Label><Term word="십신" /></Label>
        {cols.map((p) => <div key={p.key} className="text-sm">{p.ganGod === "일간" ? "나(일간)" : p.ganGod}</div>)}
      </div>
      <div className={row} style={style}>
        <Label><Term word="천간" /></Label>
        {cols.map((p) => <div key={p.key} className="flex justify-center"><Char gan={p.gan} /></div>)}
      </div>
      <div className={row} style={style}>
        <Label><Term word="지지" /></Label>
        {cols.map((p) => <div key={p.key} className="flex justify-center"><Char zhi={p.zhi} /></div>)}
      </div>
      <div className={row} style={style}>
        <Label>십신</Label>
        {cols.map((p) => <div key={p.key} className="text-sm">{p.zhiGod}</div>)}
      </div>
      <div className={`${row} border-t border-line pt-2`} style={style}>
        <Label><Term word="지장간" /></Label>
        {cols.map((p) => (
          <div key={p.key} className="text-xs text-muted">
            {p.hidden.map((h) => GAN_KO[h.gan]).join(" ")}
          </div>
        ))}
      </div>
      <div className={row} style={style}>
        <Label><Term word="12운성" /></Label>
        {cols.map((p) => (
          <div key={p.key} className="text-xs">
            <Term word={p.stage} text={STAGE_EASY[p.stage]} />
          </div>
        ))}
      </div>
      <div className={row} style={style}>
        <Label><Term word="납음" /></Label>
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

export function SectionTitle({ children, sub, easy }: { children: React.ReactNode; sub?: string; easy?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h2 className="font-serif text-xl font-bold">{children}</h2>
      {sub && <p className="text-sm text-muted">{sub}</p>}
      {easy && <EasyNote>{easy}</EasyNote>}
    </div>
  );
}

/** "쉽게 말하면" 풀이 상자 */
export function EasyNote({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mt-2 rounded-lg border-l-4 border-gold bg-surface-2 px-3 py-2 text-sm leading-relaxed ${className}`}>
      <b className="text-gold">쉽게 말하면</b> {children}
    </p>
  );
}

/**
 * 누르면 쉬운 풀이가 뜨는 용어. text를 주지 않으면 용어 사전(GLOSSARY)에서 찾는다.
 * 풀이 상자는 화면 밖으로 나가지 않도록 fixed 위치를 뷰포트 안으로 맞춘다.
 */
export function Term({ word, text, children }: { word: string; text?: string; children?: React.ReactNode }) {
  const desc = text ?? GLOSSARY[word];
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pos) return;
    const close = (e: Event) => {
      if (e.type === "keydown" && (e as KeyboardEvent).key !== "Escape") return;
      if (e.type === "pointerdown" && btn.current?.contains(e.target as Node)) return;
      setPos(null);
    };
    const events = ["pointerdown", "scroll", "resize", "keydown"] as const;
    events.forEach((t) => window.addEventListener(t, close, true));
    return () => events.forEach((t) => window.removeEventListener(t, close, true));
  }, [pos]);

  if (!desc) return <>{children ?? word}</>;
  const width = 256;
  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-expanded={!!pos}
        className="cursor-help underline decoration-gold decoration-dotted underline-offset-4"
        onClick={() => {
          if (pos) return setPos(null);
          const r = btn.current!.getBoundingClientRect();
          const left = Math.min(Math.max(8, r.left + r.width / 2 - width / 2), window.innerWidth - width - 8);
          setPos({ top: r.bottom + 6, left });
        }}
      >
        {children ?? word}
      </button>
      {pos && (
        <span
          role="tooltip"
          className="fixed z-50 rounded-lg border border-line bg-surface p-3 text-left text-xs leading-relaxed font-normal text-ink shadow-lg"
          style={{ top: pos.top, left: pos.left, width }}
        >
          <b className="mb-1 block text-sm text-accent">{word}</b>
          {desc}
        </span>
      )}
    </>
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

/** 운에 들어온 십신의 쉬운 뜻과 할 일·피할 일 */
export function LuckGuide({ gods }: { gods: TenGod[] }) {
  return (
    <div className="mt-3 space-y-2">
      {[...new Set(gods)].map((g) => (
        <div key={g} className="rounded-lg border border-line bg-surface p-3">
          <p className="font-bold">
            {g} <span className="font-normal text-muted">— {TEN_GOD_EASY[g].meaning}</span>
          </p>
          <p className="mt-1 text-xs text-muted">관련된 사람: {TEN_GOD_EASY[g].people}</p>
          <p className="mt-1.5">
            <b className="text-accent">해 보세요</b> {TEN_GOD_EASY[g].todo}
          </p>
          <p className="mt-0.5">
            <b>피하세요</b> {TEN_GOD_EASY[g].avoid}
          </p>
        </div>
      ))}
    </div>
  );
}
