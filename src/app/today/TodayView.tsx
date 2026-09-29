"use client";

import { useMemo, useState } from "react";
import { Char, ProfileBar, ScoreBar, SectionTitle } from "@/components/saju-ui";
import { useProfiles } from "@/lib/profiles";
import { computeSaju } from "@/lib/saju/calc";
import { computeDaily } from "@/lib/saju/daily";
import { ELEMENT_HEX, ELEMENT_KO, GAN_KO, ZHI_KO } from "@/lib/saju/constants";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TodayView() {
  const { active } = useProfiles();
  const [date, setDate] = useState(() => ymd(new Date()));
  const saju = useMemo(() => (active ? computeSaju(active) : null), [active]);
  const daily = useMemo(() => {
    if (!saju) return null;
    const [y, m, d] = date.split("-").map(Number);
    return computeDaily(saju, y, m, d);
  }, [saju, date]);

  const shift = (days: number) => {
    const [y, m, d] = date.split("-").map(Number);
    setDate(ymd(new Date(y, m - 1, d + days)));
  };

  if (!saju || !daily) return <ProfileBar />;

  const total = daily.scores[0].score;
  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEK[new Date(y, m - 1, d).getDay()];

  return (
    <div>
      <ProfileBar />
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-2">
          <button className="btn btn-ghost px-3" onClick={() => shift(-1)} aria-label="전날">‹</button>
          <input type="date" className="input max-w-44 text-center" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <button className="btn btn-ghost px-3" onClick={() => shift(1)} aria-label="다음날">›</button>
          {date !== ymd(new Date()) && (
            <button className="text-sm text-accent" onClick={() => setDate(ymd(new Date()))}>오늘</button>
          )}
        </div>

        <section className="card text-center">
          <p className="text-sm text-muted">
            {y}년 {m}월 {d}일 ({weekday}) · {saju.profile.name}님의 운세
          </p>
          <div className="my-4 flex items-center justify-center gap-6">
            <div className="flex gap-1">
              <Char gan={daily.ganzhi.gan} />
              <Char zhi={daily.ganzhi.zhi} />
            </div>
            <div>
              <p className="font-serif text-5xl font-bold text-accent tabular-nums">{total}</p>
              <p className="text-sm text-muted">종합 점수</p>
            </div>
          </div>
          <p className="text-sm text-muted">
            오늘의 일진 {GAN_KO[daily.ganzhi.gan]}
            {ZHI_KO[daily.ganzhi.zhi]}일 · 나에게 {daily.ganGod}/{daily.zhiGod}의 날
          </p>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed">{daily.headline}</p>
          {daily.relationNote && <p className="mx-auto mt-2 max-w-xl text-sm text-muted">{daily.relationNote}</p>}
        </section>

        <section className="card">
          <SectionTitle>분야별 운세</SectionTitle>
          <ul className="space-y-4">
            {daily.scores.map((s) => (
              <li key={s.category}>
                <div className="flex items-center gap-3">
                  <span className="w-24 shrink-0 font-bold">{s.category}</span>
                  <ScoreBar score={s.score} />
                  <span className="w-8 text-right text-sm tabular-nums">{s.score}</span>
                </div>
                <p className="mt-1 text-sm text-muted sm:pl-27">{s.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card">
          <SectionTitle sub={`오늘 보충할 기운: ${ELEMENT_KO[daily.lucky.element]}`}>오늘의 행운</SectionTitle>
          <p className="mb-4 text-sm leading-relaxed text-muted">{daily.lucky.reason}</p>
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            {[
              ["색", daily.lucky.color, null],
              ["숫자", daily.lucky.numbers, null],
              ["방향", daily.lucky.direction, `재물은 ${daily.lucky.wealthDirection}`],
              ["시간", daily.lucky.time, daily.lucky.timeNote],
            ].map(([k, v, note]) => (
              <div key={k} className="rounded-lg bg-surface-2 p-3">
                <p className="text-xs text-muted">행운의 {k}</p>
                <p
                  className="mt-1 font-bold"
                  style={k === "색" ? { color: ELEMENT_HEX[daily.lucky.element] } : undefined}
                >
                  {v}
                </p>
                {note && <p className="mt-0.5 text-[11px] text-muted">{note}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
