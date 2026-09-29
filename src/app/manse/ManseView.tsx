"use client";

import { Lunar, LunarYear, Solar } from "lunar-javascript";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Char, SectionTitle } from "@/components/saju-ui";
import { beijingToKoreaHm } from "@/lib/saju/time";
import { GAN_KO, JIEQI_KO, ZHI_KO, ZODIAC, ganIndex, zhiIndex } from "@/lib/saju/constants";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

interface DayCell {
  y: number;
  m: number;
  d: number;
  lunarM: number;
  lunarD: number;
  leap: boolean;
  gan: number;
  zhi: number;
  jieqi: string | null;
}

function dayCell(y: number, m: number, d: number): DayCell {
  const l = Solar.fromYmd(y, m, d).getLunar();
  const gz = l.getDayInGanZhi();
  const jq = l.getJieQi();
  return {
    y, m, d,
    lunarM: Math.abs(l.getMonth()),
    lunarD: l.getDay(),
    leap: l.getMonth() < 0,
    gan: ganIndex(gz[0]),
    zhi: zhiIndex(gz[1]),
    jieqi: jq ? (JIEQI_KO[jq] ?? jq) : null,
  };
}

const gzKo = (gz: string) => `${GAN_KO[ganIndex(gz[0])]}${ZHI_KO[zhiIndex(gz[1])]}`;

const noop = () => () => {};

export default function ManseView() {
  // 서버 렌더링 시점과 브라우저의 날짜가 다를 수 있어 클라이언트에서만 오늘 날짜를 읽는다
  const today = useSyncExternalStore(noop, () => new Date().toDateString(), () => null);
  const now = today ? new Date(today) : null;
  const [ym, setYm] = useState<{ y: number; m: number } | null>(null);
  const [sel, setSel] = useState<DayCell | null>(null);
  const cur = ym ?? (now ? { y: now.getFullYear(), m: now.getMonth() + 1 } : null);

  const cells = useMemo(() => {
    if (!cur) return [];
    const first = new Date(cur.y, cur.m - 1, 1).getDay();
    const days = new Date(cur.y, cur.m, 0).getDate();
    return [
      ...Array<null>(first).fill(null),
      ...Array.from({ length: days }, (_, i) => dayCell(cur.y, cur.m, i + 1)),
    ];
  }, [cur?.y, cur?.m]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cur || !now) return null;

  const move = (delta: number) => {
    const d = new Date(cur.y, cur.m - 1 + delta, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() + 1 });
    setSel(null);
  };
  const isToday = (c: DayCell) => c.y === now.getFullYear() && c.m === now.getMonth() + 1 && c.d === now.getDate();
  const mid = Solar.fromYmd(cur.y, cur.m, 15).getLunar();
  const selected = sel ?? cells.find((c): c is DayCell => !!c && isToday(c)) ?? null;

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <button className="btn btn-ghost px-3" onClick={() => move(-1)} aria-label="이전 달">‹</button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <select className="input w-auto py-1" value={cur.y} onChange={(e) => setYm({ ...cur, y: +e.target.value })} aria-label="년">
                {Array.from({ length: 201 }, (_, i) => 1900 + i).map((y) => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select className="input w-auto py-1" value={cur.m} onChange={(e) => setYm({ ...cur, m: +e.target.value })} aria-label="월">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m}월</option>)}
              </select>
            </div>
            <p className="mt-1 text-sm text-muted">
              {gzKo(mid.getYearInGanZhiExact())}년 ({ZODIAC[zhiIndex(mid.getYearInGanZhiExact()[1])]}띠) · {gzKo(mid.getMonthInGanZhiExact())}월
            </p>
          </div>
          <button className="btn btn-ghost px-3" onClick={() => move(1)} aria-label="다음 달">›</button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {WEEK.map((w, i) => (
            <div key={w} className={`py-1 font-bold ${i === 0 ? "text-accent" : i === 6 ? "text-[#2b4c8c] dark:text-[#7fa1e0]" : "text-muted"}`}>{w}</div>
          ))}
          {cells.map((c, i) =>
            c ? (
              <button
                key={i}
                onClick={() => setSel(c)}
                className={`flex min-h-16 flex-col items-center rounded-lg border p-1 transition sm:min-h-20 ${
                  selected && selected.y === c.y && selected.m === c.m && selected.d === c.d ? "border-accent bg-accent-soft" : isToday(c) ? "border-gold" : "border-transparent hover:border-line"
                }`}
              >
                <span className={`text-sm font-bold ${i % 7 === 0 ? "text-accent" : ""}`}>{c.d}</span>
                <span className="text-[10px] text-muted">
                  {c.lunarD === 1 || c.d === 1 ? `${c.leap ? "윤" : ""}${c.lunarM}.${c.lunarD}` : c.lunarD}
                </span>
                <span className="font-serif text-[11px] sm:text-xs">{GAN_KO[c.gan]}{ZHI_KO[c.zhi]}</span>
                {c.jieqi && <span className="mt-0.5 rounded bg-gold/20 px-1 text-[10px] text-gold">{c.jieqi}</span>}
              </button>
            ) : (
              <div key={i} />
            ),
          )}
        </div>
      </section>

      {selected && <DayDetail c={selected} />}
      <Converter />
    </div>
  );
}

function DayDetail({ c }: { c: DayCell }) {
  const l = Solar.fromYmd(c.y, c.m, c.d).getLunar();
  const y = l.getYearInGanZhiExact();
  const m = l.getMonthInGanZhiExact();
  const d = l.getDayInGanZhi();
  const jq = l.getJieQi();
  const jqSolar = jq ? l.getJieQiTable()[jq] : null;
  const jqTime = jqSolar
    ? beijingToKoreaHm(jqSolar.getYear(), jqSolar.getMonth(), jqSolar.getDay(), jqSolar.getHour(), jqSolar.getMinute())
    : null;
  const pillars: [string, string][] = [["일", d], ["월", m], ["년", y]];
  return (
    <section className="card">
      <SectionTitle sub={`음력 ${l.getYear()}년 ${c.leap ? "윤" : ""}${c.lunarM}월 ${c.lunarD}일 · ${WEEK[new Date(c.y, c.m - 1, c.d).getDay()]}요일`}>
        {c.y}년 {c.m}월 {c.d}일
      </SectionTitle>
      <div className="flex flex-wrap items-center gap-6">
        {pillars.map(([label, gz]) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <span className="text-xs text-muted">{label}주</span>
            <Char gan={ganIndex(gz[0])} size="sm" />
            <Char zhi={zhiIndex(gz[1])} size="sm" />
            <span className="text-xs">{gzKo(gz)}</span>
          </div>
        ))}
        {jq && (
          <p className="text-sm">
            <b className="text-gold">{JIEQI_KO[jq] ?? jq}</b>
            <span className="block text-muted">절입 시각 {jqTime} (한국 시각)</span>
          </p>
        )}
      </div>
      <p className="mt-3 text-xs text-muted">월주는 절기(절입일) 기준이며, 절입 시각 전에 태어난 경우 이전 달 월주가 적용됩니다.</p>
    </section>
  );
}

function Converter() {
  const [mode, setMode] = useState<"s2l" | "l2s">("s2l");
  const [y, setY] = useState(2000);
  const [m, setM] = useState(1);
  const [d, setD] = useState(1);
  const [leap, setLeap] = useState(false);

  let result: string;
  try {
    if (mode === "s2l") {
      const dt = new Date(y, m - 1, d);
      if (dt.getMonth() !== m - 1) throw new Error();
      const l = Solar.fromYmd(y, m, d).getLunar();
      result = `음력 ${l.getYear()}년 ${l.getMonth() < 0 ? "윤" : ""}${Math.abs(l.getMonth())}월 ${l.getDay()}일 · ${gzKo(l.getDayInGanZhi())}일`;
    } else {
      if (leap && LunarYear.fromYear(y).getLeapMonth() !== m) throw new Error("leap");
      const l = Lunar.fromYmd(y, leap ? -m : m, d);
      if (l.getDay() !== d) throw new Error();
      const s = l.getSolar();
      result = `양력 ${s.getYear()}년 ${s.getMonth()}월 ${s.getDay()}일 (${WEEK[s.getWeek()]})`;
    }
  } catch (e) {
    result = (e as Error).message === "leap" ? `${y}년에는 윤${m}월이 없습니다.` : "존재하지 않는 날짜입니다.";
  }

  return (
    <section className="card">
      <SectionTitle>양력 ↔ 음력 변환</SectionTitle>
      <div className="flex flex-wrap items-center gap-2">
        <select className="input w-auto" value={mode} onChange={(e) => setMode(e.target.value as "s2l" | "l2s")} aria-label="변환 방향">
          <option value="s2l">양력 → 음력</option>
          <option value="l2s">음력 → 양력</option>
        </select>
        <input type="number" className="input w-24" value={y} min={1900} max={2100} onChange={(e) => setY(+e.target.value)} aria-label="년" />
        <select className="input w-auto" value={m} onChange={(e) => setM(+e.target.value)} aria-label="월">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((v) => <option key={v} value={v}>{v}월</option>)}
        </select>
        <select className="input w-auto" value={d} onChange={(e) => setD(+e.target.value)} aria-label="일">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((v) => <option key={v} value={v}>{v}일</option>)}
        </select>
        {mode === "l2s" && (
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={leap} onChange={(e) => setLeap(e.target.checked)} /> 윤달
          </label>
        )}
      </div>
      <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 font-bold">{y >= 1900 && y <= 2100 ? result : "1900~2100년만 지원합니다."}</p>
    </section>
  );
}
