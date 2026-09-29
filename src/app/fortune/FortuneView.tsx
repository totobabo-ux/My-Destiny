"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Char, ProfileBar, ScoreBar, SectionTitle } from "@/components/saju-ui";
import { useProfiles } from "@/lib/profiles";
import { computeSaju } from "@/lib/saju/calc";
import { GAN_KO, ZHI_KO, ZODIAC } from "@/lib/saju/constants";
import { type MonthLuck, computeYearly } from "@/lib/saju/yearly";

const noop = () => () => {};

export default function FortuneView() {
  const { active } = useProfiles();
  // 서버 렌더링과 브라우저의 연도가 다를 수 있어 클라이언트에서만 올해를 읽는다
  const thisYear = useSyncExternalStore(noop, () => new Date().getFullYear(), () => null);
  const [picked, setPicked] = useState<number | null>(null);
  const year = picked ?? thisYear;
  const saju = useMemo(() => (active ? computeSaju(active) : null), [active]);
  const y = useMemo(() => (saju && year ? computeYearly(saju, year) : null), [saju, year]);

  if (!saju || !y || !thisYear) return <ProfileBar />;

  return (
    <div>
      <ProfileBar />
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-2">
          <button className="btn btn-ghost px-3" onClick={() => setPicked(y.year - 1)} aria-label="이전 해">‹</button>
          <select className="input w-auto" value={y.year} onChange={(e) => setPicked(+e.target.value)} aria-label="연도">
            {Array.from({ length: 21 }, (_, i) => thisYear - 5 + i).map((v) => (
              <option key={v} value={v}>{v}년</option>
            ))}
          </select>
          <button className="btn btn-ghost px-3" onClick={() => setPicked(y.year + 1)} aria-label="다음 해">›</button>
        </div>

        <section className="card text-center">
          <p className="text-sm text-muted">
            {saju.profile.name}님의 {y.year}년 신년운세 · {y.age}세 · {ZODIAC[saju.zodiac]}띠
          </p>
          <div className="my-4 flex items-center justify-center gap-6">
            <div className="flex gap-1">
              <Char gan={y.gan} />
              <Char zhi={y.zhi} />
            </div>
            <div>
              <p className="font-serif text-5xl font-bold text-accent tabular-nums">{y.score}</p>
              <p className="text-sm text-muted">올해 총운</p>
            </div>
          </div>
          <p className="text-sm text-muted">
            {GAN_KO[y.gan]}{ZHI_KO[y.zhi]}년 · 나에게 {y.ganGod}/{y.zhiGod}의 해
          </p>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed">{y.headline}</p>
          {y.samjae && (
            <p className="mx-auto mt-4 max-w-xl rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
              <b>{y.samjae.kind}</b> — {y.samjae.text}
            </p>
          )}
        </section>

        {y.details.length > 0 && (
          <section className="card">
            <SectionTitle>올해의 흐름</SectionTitle>
            <ul className="space-y-2 text-sm leading-relaxed">
              {y.details.map((d) => <li key={d}>• {d}</li>)}
            </ul>
          </section>
        )}

        <section className="card">
          <SectionTitle>분야별 한 해 운세</SectionTitle>
          <ul className="space-y-4">
            {y.categories.map((c) => (
              <li key={c.category}>
                <div className="flex items-center gap-3">
                  <span className="w-24 shrink-0 font-bold">{c.category}</span>
                  <ScoreBar score={c.score} />
                  <span className="w-8 text-right text-sm tabular-nums">{c.score}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{c.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <SectionTitle sub="절기 기준 12개월 (입춘 무렵 시작하는 인월부터)">월별 운세</SectionTitle>
          <MonthChart months={y.months} best={y.bestMonths[0]} worst={y.cautionMonths[0]} />
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p className="rounded-lg bg-surface-2 p-3">
              <b className="text-accent">좋은 달</b> {y.bestMonths.map((m) => `${m.solarLabel}(${m.keyword})`).join(", ")}
            </p>
            <p className="rounded-lg bg-surface-2 p-3">
              <b>조심할 달</b> {y.cautionMonths.map((m) => `${m.solarLabel}(${m.keyword})`).join(", ")}
            </p>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {y.months.map((m) => (
              <li key={m.index} className="flex items-start gap-3 py-3">
                <div className="w-14 shrink-0 text-center">
                  <p className="font-bold">{m.solarLabel}</p>
                  <p className="text-[11px] text-muted">{m.jieqi}~</p>
                </div>
                <div className="flex-1 text-sm">
                  <p className="flex items-center gap-2">
                    <span className="font-bold">{GAN_KO[m.gan]}{ZHI_KO[m.zhi]}월</span>
                    <span className="text-muted">{m.keyword}</span>
                    <span className="ml-auto font-bold tabular-nums">{m.score}</span>
                  </p>
                  <p className="text-muted">{m.text}</p>
                  {m.note && <p className="mt-0.5 text-xs text-accent">{m.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** 12개월 점수 막대 차트. 단일 계열이라 범례 없이 제목으로 설명하고, 최고·최저 달만 값을 직접 표시한다. */
function MonthChart({ months, best, worst }: { months: MonthLuck[]; best: MonthLuck; worst: MonthLuck }) {
  const [hover, setHover] = useState<number | null>(null);
  const min = 30;
  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      <div className="flex h-40 items-end gap-[2px] border-b border-line">
        {months.map((m) => {
          const h = ((m.score - min) / (100 - min)) * 100;
          const labeled = m === best || m === worst;
          return (
            <div
              key={m.index}
              className="relative flex h-full flex-1 cursor-default items-end justify-center"
              onMouseEnter={() => setHover(m.index)}
              onClick={() => setHover(m.index)}
            >
              {(labeled || hover === m.index) && (
                <span className="absolute text-[11px] font-bold tabular-nums" style={{ bottom: `calc(${h}% + 2px)` }}>
                  {m.score}
                </span>
              )}
              <div
                className="w-full max-w-7 rounded-t-[4px] transition-opacity"
                style={{
                  height: `${h}%`,
                  background: "var(--accent)",
                  opacity: hover === null || hover === m.index ? 1 : 0.45,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-[2px]">
        {months.map((m) => (
          <span key={m.index} className={`flex-1 text-center text-[10px] ${hover === m.index ? "font-bold text-ink" : "text-muted"}`}>
            {m.solarLabel.replace("월", "")}
          </span>
        ))}
      </div>
      {hover !== null && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-56 -translate-x-1/2 rounded-lg border border-line bg-surface p-2 text-xs shadow-md">
          <p className="font-bold">
            {months[hover].solarLabel} · {GAN_KO[months[hover].gan]}{ZHI_KO[months[hover].zhi]}월 · {months[hover].score}점
          </p>
          <p className="text-muted">{months[hover].text}</p>
        </div>
      )}
    </div>
  );
}
