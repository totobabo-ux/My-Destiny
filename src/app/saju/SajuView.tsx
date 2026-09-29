"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Char, ElementBars, PillarTable, ProfileBar, SectionTitle, ShareButton } from "@/components/saju-ui";
import { newId, useProfiles } from "@/lib/profiles";
import { decodeProfile, encodeProfile } from "@/lib/share";
import { type SajuResult, computeSaju, yearGanZhi } from "@/lib/saju/calc";
import {
  type TenGod,
  GAN as GAN_HANJA,
  ZHI as ZHI_HANJA,
  ELEMENT_COLOR_NAME,
  ELEMENT_DIRECTION,
  ELEMENT_HEX,
  ELEMENT_KO,
  ELEMENT_NUMBERS,
  GAN_ELEMENT,
  GAN_KO,
  ZHI_KO,
  ZODIAC,
  isSanHe,
  isZhiChong,
  isZhiHe,
  tenGod,
  zhiMainGan,
} from "@/lib/saju/constants";
import { computeLifeStages } from "@/lib/saju/lifestages";
import { computeYearly } from "@/lib/saju/yearly";
import { DAY_GAN_TEXT, ELEMENT_EXCESS, ELEMENT_LACK, GROUP_TEXT, TEN_GOD_LUCK, TEN_GOD_TEXT } from "@/lib/saju/interpret";
import { DAY_PILLAR_TEXT } from "@/lib/saju/daypillars";

export default function SajuView({ shared }: { shared?: string }) {
  const router = useRouter();
  const { active, save } = useProfiles();
  const sharedProfile = useMemo(() => (shared ? decodeProfile(shared) : null), [shared]);
  const target = sharedProfile ?? active;
  const saju = useMemo(() => (target ? computeSaju(target) : null), [target]);

  return (
    <div>
      {sharedProfile ? (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 border-gold">
          <p className="text-sm">
            <b>{sharedProfile.name}</b>님이 공유한 사주 결과입니다.
          </p>
          <div className="flex gap-2">
            <button
              className="btn text-sm"
              onClick={() => {
                save({ ...sharedProfile, id: newId() });
                router.replace("/saju");
              }}
            >
              내 목록에 저장
            </button>
            <Link href="/saju" className="btn btn-ghost text-sm">내 사주 보기</Link>
          </div>
        </div>
      ) : (
        <>
          {shared && <p className="mb-4 rounded-md bg-accent-soft px-3 py-2 text-sm text-accent">공유 링크가 올바르지 않습니다.</p>}
          <ProfileBar />
        </>
      )}
      {saju && <SajuBody saju={saju} thisYear={new Date().getFullYear()} />}
    </div>
  );
}

const TIER_LABEL = ["좋음", "보통", "노력 필요"] as const;

function DayPillarSection({ saju }: { saju: SajuResult }) {
  const d = saju.pillars[2];
  const entry = DAY_PILLAR_TEXT[GAN_HANJA[d.gan] + ZHI_HANJA[d.zhi]];
  return (
    <section className="card">
      <SectionTitle sub="태어난 날의 간지(일주)로 보는 나의 본모습">
        나는 어떤 사람인가 — {GAN_KO[d.gan]}{ZHI_KO[d.zhi]}일주
      </SectionTitle>
      <div className="flex items-start gap-4">
        <div className="flex shrink-0 flex-col gap-1">
          <Char gan={d.gan} size="sm" />
          <Char zhi={d.zhi} size="sm" />
        </div>
        <div>
          <p className="font-serif text-lg font-bold text-accent">{entry.image}</p>
          <p className="mt-1 leading-relaxed">{entry.text}</p>
        </div>
      </div>
      <div className="mt-4 rounded-lg bg-surface-2 p-3 text-sm leading-relaxed">
        <p className="font-bold">연애·배우자</p>
        <p className="text-muted">{entry.love}</p>
      </div>
    </section>
  );
}

/** 두드러진 개별 십신: 월지(사회적 성향)는 가중치 2배. 2점 이상인 것 중 상위 2개 */
function TenGodDetail({ saju }: { saju: SajuResult }) {
  const count = new Map<TenGod, number>();
  const add = (g: TenGod, w: number) => count.set(g, (count.get(g) ?? 0) + w);
  for (const p of saju.pillars) {
    if (p.ganGod !== "일간") add(p.ganGod, 1);
    add(p.zhiGod, p.key === "month" ? 2 : 1);
  }
  const top = [...count.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 2);
  const monthGod = saju.pillars[1].zhiGod;
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-lg border border-line p-3 text-sm leading-relaxed">
        <p className="font-bold">
          사회적 성향 (월지 {monthGod}) <span className="font-normal text-muted">— 일과 사회생활에서 드러나는 모습</span>
        </p>
        <p className="mt-1 text-muted">{TEN_GOD_TEXT[monthGod].text}</p>
      </div>
      {top
        .filter(([g]) => g !== monthGod)
        .map(([g]) => (
          <div key={g} className="rounded-lg border border-line p-3 text-sm leading-relaxed">
            <p className="font-bold">{TEN_GOD_TEXT[g].title}</p>
            <p className="mt-1 text-muted">{TEN_GOD_TEXT[g].text}</p>
          </div>
        ))}
    </div>
  );
}

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
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-serif text-2xl font-bold">{p.name}님의 사주팔자</h1>
            <p className="text-sm text-muted">
              양력 {saju.solar.year}.{saju.solar.month}.{saju.solar.day}
              {saju.hasTime && ` ${pad(saju.solar.hour)}:${pad(saju.solar.minute)}`}
              {saju.timeAdjust && saju.timeAdjust.notes.length > 0 && ` (${saju.timeAdjust.notes.join(", ")})`}
              {" · "}음력 {saju.lunar.year}.{saju.lunar.leap ? "윤" : ""}
              {saju.lunar.month}.{saju.lunar.day}
              {" · "}
              {ZODIAC[saju.zodiac]}띠 · {p.gender === "M" ? "남" : "여"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="rounded-full bg-accent-soft px-3 py-1 text-sm font-bold text-accent">
              {GAN_KO[pillars[2].gan]}
              {ZHI_KO[pillars[2].zhi]} 일주
            </p>
            <ShareButton path={`/saju?p=${encodeProfile(p)}`} title={`${p.name}님의 사주팔자`} />
          </div>
        </div>
        <div className="mt-5">
          <PillarTable pillars={pillars} />
        </div>
        {!saju.hasTime && <p className="mt-3 text-xs text-muted">태어난 시간을 몰라 시주를 제외한 6글자로 풀이합니다.</p>}
      </section>

      <DayPillarSection saju={saju} />

      <section className="card">
        <SectionTitle sub="사주의 주인인 일간(日干)으로 보는 타고난 기질">일간 — {day.image}</SectionTitle>
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
              용신: {ELEMENT_KO[yongsin]} <span className="text-xs font-normal">({saju.yongsinInfo.basis})</span>
            </p>
            <p className="mt-1">{saju.yongsinInfo.reason}</p>
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
        <TenGodDetail saju={saju} />
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

      <DaYunSection saju={saju} thisYear={thisYear} />
    </div>
  );
}

/** 대운을 누르면 그 대운이 시작되는 해부터 10년간의 세운을 보여 준다. 처음에는 현재 대운을 연다. */
function DaYunSection({ saju, thisYear }: { saju: SajuResult; thisYear: number }) {
  const current = [...saju.daYun].reverse().find((d) => d.startYear <= thisYear) ?? null;
  const [picked, setPicked] = useState<number | null>(null);
  const selected = saju.daYun.find((d) => d.startYear === picked) ?? current ?? saju.daYun[0];
  const years = Array.from({ length: 10 }, (_, i) => selected.startYear + i);
  const age = thisYear - saju.solar.year;

  return (
    <section className="card">
      <SectionTitle sub={`대운수 ${saju.daYunStartAge} · 대운을 누르면 그 10년의 세운을 볼 수 있습니다 (만 나이)`}>
        대운과 세운
      </SectionTitle>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pt-1 pb-2" role="tablist" aria-label="대운 선택">
        {saju.daYun.map((d) => {
          const isSel = d === selected;
          return (
            <button
              key={d.startYear}
              role="tab"
              aria-selected={isSel}
              onClick={() => setPicked(d.startYear)}
              className={`relative flex shrink-0 flex-col items-center gap-1 rounded-xl p-2 transition ${
                isSel ? "bg-accent-soft ring-2 ring-accent" : "hover:bg-surface-2"
              }`}
            >
              {d === current && (
                <span className="absolute -top-1 right-0 rounded bg-accent px-1 text-[9px] leading-4 text-white">현재</span>
              )}
              <span className="text-xs font-bold">{d.age}세</span>
              <span className="text-[11px] text-muted">{d.ganGod}</span>
              <Char gan={d.gan} size="sm" />
              <Char zhi={d.zhi} size="sm" />
              <span className="text-[11px] text-muted">{d.zhiGod}</span>
              <span className="text-[10px] text-muted">{d.startYear}</span>
            </button>
          );
        })}
      </div>
      {age < saju.daYunStartAge && <p className="mt-2 text-sm text-muted">아직 첫 대운이 시작되기 전입니다.</p>}

      <div className="mt-4 rounded-xl bg-surface-2 p-4 text-sm leading-relaxed">
        <p className="font-bold">
          {GAN_KO[selected.gan]}
          {ZHI_KO[selected.zhi]} 대운 · {selected.age}~{selected.age + 9}세 ({selected.startYear}~{selected.startYear + 9}년)
        </p>
        <p className="mt-1 text-muted">
          천간 {selected.ganGod}: {TEN_GOD_LUCK[selected.ganGod].text} 지지에는 {selected.zhiGod}(
          {TEN_GOD_LUCK[selected.zhiGod].keyword})의 기운이 바탕에 깔립니다.
        </p>
      </div>

      <ul className="mt-2 divide-y divide-line">
        {years.map((y) => {
          const { gan, zhi } = yearGanZhi(y);
          const g = tenGod(saju.dayGan, gan);
          const z = tenGod(saju.dayGan, zhiMainGan(zhi));
          const score = computeYearly(saju, y).score;
          const rel = isZhiChong(selected.zhi, zhi)
            ? "대운과 충 — 변동이 큰 해"
            : isZhiHe(selected.zhi, zhi) || isSanHe(selected.zhi, zhi)
              ? "대운과 합 — 대운의 기운이 힘을 받는 해"
              : null;
          return (
            <li key={y} className={`flex items-start gap-3 py-3 ${y === thisYear ? "-mx-2 rounded-lg bg-accent-soft/60 px-2" : ""}`}>
              <div className="flex shrink-0 gap-1">
                <Char gan={gan} size="sm" />
                <Char zhi={zhi} size="sm" />
              </div>
              <div className="flex-1 text-sm">
                <p className="flex flex-wrap items-center gap-x-2 font-bold">
                  <span>
                    {y}년 {GAN_KO[gan]}
                    {ZHI_KO[zhi]}년
                  </span>
                  <span className="font-normal text-muted">
                    {y - saju.solar.year}세 · {g}/{z}
                  </span>
                  {y === thisYear && <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-white">올해</span>}
                  <span className="ml-auto tabular-nums">{score}</span>
                </p>
                <p className="text-muted">{TEN_GOD_LUCK[g].text}</p>
                {rel && <p className="mt-0.5 text-xs text-accent">{rel}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
