"use client";

import { useMemo } from "react";
import { Char, ElementBars, PillarTable, ProfileBar, SectionTitle } from "@/components/saju-ui";
import { useProfiles } from "@/lib/profiles";
import { type SajuResult, computeSaju, yearGanZhi } from "@/lib/saju/calc";
import {
  ELEMENT_COLOR_NAME,
  ELEMENT_DIRECTION,
  ELEMENT_HEX,
  ELEMENT_KO,
  ELEMENT_NUMBERS,
  GAN_ELEMENT,
  GAN_KO,
  ZHI_KO,
  ZODIAC,
  tenGod,
  zhiMainGan,
} from "@/lib/saju/constants";
import { computeLifeStages } from "@/lib/saju/lifestages";
import { DAY_GAN_TEXT, ELEMENT_EXCESS, ELEMENT_LACK, GROUP_TEXT, TEN_GOD_LUCK } from "@/lib/saju/interpret";

export default function SajuView() {
  const { active } = useProfiles();
  const saju = useMemo(() => (active ? computeSaju(active) : null), [active]);

  return (
    <div>
      <ProfileBar />
      {saju && <SajuBody saju={saju} thisYear={new Date().getFullYear()} />}
    </div>
  );
}

const TIER_LABEL = ["좋음", "보통", "노력 필요"] as const;

function LifeStagesSection({ saju, age }: { saju: SajuResult; age: number }) {
  const stages = computeLifeStages(saju);
  const current = age < 30 ? "early" : age < 60 ? "middle" : "late";
  return (
    <section className="card">
      <SectionTitle sub="원국의 자리(궁위)와 그 시기에 흐르는 대운을 함께 본 인생의 흐름">초년 · 중년 · 말년운</SectionTitle>

      {/* 세 시기의 점수를 한눈에 비교 */}
      <div className="mb-5 grid grid-cols-3 items-end gap-3 rounded-xl bg-surface-2 px-4 pt-4 pb-3">
        {stages.map((st) => (
          <div key={st.key} className="flex flex-col items-center gap-1">
            <span className="text-sm font-bold tabular-nums">{st.score}</span>
            <div className="flex h-24 w-full max-w-16 items-end">
              <div
                className="w-full rounded-t-md"
                style={{
                  height: `${st.score}%`,
                  background: st.tier === 0 ? "var(--accent)" : st.tier === 1 ? "var(--gold)" : "var(--muted)",
                }}
              />
            </div>
            <span className={`text-sm ${st.key === current ? "font-bold text-accent" : "text-muted"}`}>
              {st.name.replace("운", "")}
              {st.key === current && " · 지금"}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {stages.map((st) => (
          <article
            key={st.key}
            className={`rounded-xl border p-4 ${st.key === current ? "border-accent" : "border-line"}`}
          >
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-serif text-lg font-bold">
                {st.name} <span className="text-sm font-normal text-muted">{st.range}</span>
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  st.tier === 0 ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"
                }`}
              >
                {TIER_LABEL[st.tier]} · {st.score}점
              </span>
            </header>
            <p className="mt-2 font-medium leading-relaxed">{st.summary}</p>
            <p className="mt-2 text-sm leading-relaxed">{st.groupText}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{st.flowText}</p>
            {st.daYun.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {st.daYun.map((d) => (
                  <span key={d.startYear} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs">
                    {GAN_KO[d.gan]}
                    {ZHI_KO[d.zhi]} <span className="text-muted">{d.age}세~</span>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-3 text-sm">
              <b className="text-accent">조언</b> {st.advice}
            </p>
            <p className="mt-2 text-[11px] text-muted">
              근거: {st.basis} · 중심 기운 {st.mainGroup}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SajuBody({ saju, thisYear }: { saju: SajuResult; thisYear: number }) {
  const { profile: p, pillars, dayGan, elements, strength, yongsin, groups } = saju;
  const day = DAY_GAN_TEXT[dayGan];
  const dayEl = GAN_ELEMENT[dayGan];
  const excess = elements.map((n, i) => (n >= 3 ? i : -1)).filter((i) => i >= 0);
  const lack = elements.map((n, i) => (n === 0 ? i : -1)).filter((i) => i >= 0);
  const age = thisYear - saju.solar.year;
  const curDaYun = [...saju.daYun].reverse().find((d) => d.startYear <= thisYear);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-serif text-2xl font-bold">{p.name}님의 사주팔자</h1>
            <p className="text-sm text-muted">
              양력 {saju.solar.year}.{saju.solar.month}.{saju.solar.day}
              {saju.hasTime && ` ${pad(saju.solar.hour)}:${pad(saju.solar.minute)}${p.timeCorrection ? " (보정)" : ""}`}
              {" · "}음력 {saju.lunar.year}.{saju.lunar.leap ? "윤" : ""}
              {saju.lunar.month}.{saju.lunar.day}
              {" · "}
              {ZODIAC[saju.zodiac]}띠 · {p.gender === "M" ? "남" : "여"}
            </p>
          </div>
          <p className="rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-accent">
            {GAN_KO[pillars[2].gan]}
            {ZHI_KO[pillars[2].zhi]} 일주
          </p>
        </div>
        <div className="mt-5">
          <PillarTable pillars={pillars} />
        </div>
        {!saju.hasTime && <p className="mt-3 text-xs text-muted">태어난 시간을 몰라 시주를 제외한 6글자로 풀이합니다.</p>}
      </section>

      <section className="card">
        <SectionTitle sub="사주의 주인인 일간(日干)으로 보는 타고난 기질">나는 어떤 사람인가 — {day.image}</SectionTitle>
        <p className="leading-relaxed">{day.nature}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-surface-2 p-3">
            <dt className="font-bold">강점</dt>
            <dd className="text-muted">{day.strength}</dd>
          </div>
          <div className="rounded-lg bg-surface-2 p-3">
            <dt className="font-bold">주의할 점</dt>
            <dd className="text-muted">{day.caution}</dd>
          </div>
          <div className="rounded-lg bg-surface-2 p-3">
            <dt className="font-bold">어울리는 분야</dt>
            <dd className="text-muted">{day.career}</dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <SectionTitle sub={`나의 오행: ${ELEMENT_KO[dayEl]} · ★ 용신`}>오행 분포</SectionTitle>
          <ElementBars elements={elements} highlight={yongsin} />
          <div className="mt-4 space-y-2 text-sm leading-relaxed">
            {excess.map((i) => (
              <p key={`e${i}`}>• {ELEMENT_EXCESS[i]}</p>
            ))}
            {lack.map((i) => (
              <p key={`l${i}`}>• {ELEMENT_LACK[i]}</p>
            ))}
            {!excess.length && !lack.length && <p>• 오행이 고르게 분포되어 균형 잡힌 사주입니다.</p>}
          </div>
        </div>
        <div className="card">
          <SectionTitle sub="일간을 돕는 기운의 비율">신강·신약과 용신</SectionTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">신약</span>
            <div className="relative h-3 flex-1 rounded-full bg-surface-2">
              <div
                className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent"
                style={{ left: `${strength.score}%` }}
              />
            </div>
            <span className="text-sm text-muted">신강</span>
          </div>
          <p className="mt-3 text-center font-bold">{strength.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {strength.strong
              ? "일간의 힘이 넉넉합니다. 기운을 밖으로 쓰는 활동(표현·재물·직장)을 통해 운이 풀립니다."
              : "일간의 힘이 다소 약합니다. 배움과 주변의 도움으로 힘을 기르면 운이 안정됩니다."}
          </p>
          <div className="mt-4 rounded-lg p-3 text-sm" style={{ background: `${ELEMENT_HEX[yongsin]}1f` }}>
            <p className="font-bold" style={{ color: ELEMENT_HEX[yongsin] }}>
              용신: {ELEMENT_KO[yongsin]}
            </p>
            <p className="mt-1 text-muted">
              행운의 색 {ELEMENT_COLOR_NAME[yongsin]} · 숫자 {ELEMENT_NUMBERS[yongsin].join(", ")} · 방향 {ELEMENT_DIRECTION[yongsin]}
            </p>
          </div>
        </div>
      </section>

      <section className="card">
        <SectionTitle sub="사주 8글자가 나에게 어떤 역할을 하는가">십신 분포</SectionTitle>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(groups).map(([g, n]) => (
            <div key={g} className="rounded-lg bg-surface-2 p-3 text-center">
              <p className="text-sm text-muted">{g}</p>
              <p className="text-2xl font-bold tabular-nums">{n}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 text-sm leading-relaxed">
          {Object.entries(groups)
            .filter(([, n]) => n >= 3 || n === 0)
            .map(([g, n]) => (
              <p key={g}>
                <b>{GROUP_TEXT[g].name}</b> {n >= 3 ? "발달" : "부족"} — {n >= 3 ? GROUP_TEXT[g].many : GROUP_TEXT[g].few}
              </p>
            ))}
        </div>
      </section>

      {(saju.sinsal.length > 0 || saju.relations.length > 0) && (
        <section className="card">
          <SectionTitle>신살과 합·충</SectionTitle>
          <ul className="space-y-2 text-sm">
            {saju.sinsal.map((s) => (
              <li key={s.name}>
                <b>{s.name}</b> <span className="text-muted">— {s.desc}</span>
              </li>
            ))}
          </ul>
          {saju.relations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {saju.relations.map((r, i) => (
                <span key={i} className={`rounded-full px-2.5 py-1 text-xs ${r.good ? "bg-surface-2" : "bg-accent-soft text-accent"}`}>
                  {r.where} {r.kind}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <LifeStagesSection saju={saju} age={age} />

      <section className="card">
        <SectionTitle sub={`대운수 ${saju.daYunStartAge} · 10년마다 바뀌는 큰 운의 흐름 (만 나이)`}>대운</SectionTitle>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {saju.daYun.map((d) => (
            <div
              key={d.startYear}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-xl p-2 ${d === curDaYun ? "bg-accent-soft ring-2 ring-accent" : ""}`}
            >
              <span className="text-xs font-bold">{d.age}세</span>
              <span className="text-[11px] text-muted">{d.ganGod}</span>
              <Char gan={d.gan} size="sm" />
              <Char zhi={d.zhi} size="sm" />
              <span className="text-[11px] text-muted">{d.zhiGod}</span>
              <span className="text-[10px] text-muted">{d.startYear}</span>
            </div>
          ))}
        </div>
        {curDaYun && (
          <p className="mt-3 text-sm leading-relaxed">
            <b>
              현재 대운 ({GAN_KO[curDaYun.gan]}
              {ZHI_KO[curDaYun.zhi]}, {curDaYun.age}세~)
            </b>{" "}
            — 천간 {curDaYun.ganGod}: {TEN_GOD_LUCK[curDaYun.ganGod].text} 지지에는 {curDaYun.zhiGod}(
            {TEN_GOD_LUCK[curDaYun.zhiGod].keyword})의 기운이 바탕에 깔립니다.
          </p>
        )}
        {age < saju.daYunStartAge && <p className="mt-3 text-sm text-muted">아직 첫 대운이 시작되기 전입니다.</p>}
      </section>

      <section className="card">
        <SectionTitle sub="해마다 들어오는 운">세운 (연운)</SectionTitle>
        <ul className="divide-y divide-line">
          {Array.from({ length: 6 }, (_, i) => thisYear + i).map((y) => {
            const { gan, zhi } = yearGanZhi(y);
            const g = tenGod(dayGan, gan);
            const z = tenGod(dayGan, zhiMainGan(zhi));
            return (
              <li key={y} className="flex items-start gap-3 py-3">
                <div className="flex shrink-0 gap-1">
                  <Char gan={gan} size="sm" />
                  <Char zhi={zhi} size="sm" />
                </div>
                <div className="text-sm">
                  <p className="font-bold">
                    {y}년 {GAN_KO[gan]}
                    {ZHI_KO[zhi]}년{" "}
                    <span className="font-normal text-muted">
                      ({y - saju.solar.year}세 · {g}/{z})
                    </span>
                    {y === thisYear && <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[10px] text-white">올해</span>}
                  </p>
                  <p className="text-muted">{TEN_GOD_LUCK[g].text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
