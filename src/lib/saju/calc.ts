import { Lunar, Solar } from "lunar-javascript";
import {
  type Element,
  type TenGod,
  GAN_ELEMENT,
  NAYIN_KO,
  PEACH_HORSE_CANOPY,
  TEN_GOD_GROUP,
  TIANYI,
  YANGREN,
  ZHI_ELEMENT,
  ZHI_HIDDEN,
  ganIndex,
  isSanHe,
  isZhiChong,
  isZhiHai,
  isZhiHe,
  isZhiXing,
  isYuanJin,
  isGanHe,
  isGanChong,
  tenGod,
  twelveStage,
  zhiIndex,
  zhiMainGan,
} from "./constants";
import { type TimeAdjust, adjustBirthTime, cityOf } from "./time";

export interface Profile {
  id: string;
  name: string;
  gender: "M" | "F";
  calendar: "solar" | "lunar";
  leapMonth: boolean;
  year: number;
  month: number;
  day: number;
  /** null이면 태어난 시간을 모름 */
  hour: number | null;
  minute: number | null;
  /** 출생지 경도 기준 태양시 보정. 서머타임은 이 값과 무관하게 항상 보정한다. */
  timeCorrection: boolean;
  /** 출생지 (time.ts CITIES의 key). 없으면 서울 */
  city?: string;
  /** 야자시 적용: 23~24시 출생을 당일 일주로 본다 */
  yajasi: boolean;
}

export interface Pillar {
  key: "year" | "month" | "day" | "time";
  label: string;
  gan: number;
  zhi: number;
  ganGod: TenGod | "일간";
  zhiGod: TenGod;
  hidden: { gan: number; god: TenGod }[];
  stage: string;
  nayin: string;
}

export interface DaYunItem {
  gan: number;
  zhi: number;
  age: number;
  startYear: number;
  ganGod: TenGod;
  zhiGod: TenGod;
}

export interface Relation {
  kind: string;
  where: string;
  good: boolean;
}

export interface SajuResult {
  profile: Profile;
  solar: { year: number; month: number; day: number; hour: number; minute: number };
  lunar: { year: number; month: number; day: number; leap: boolean };
  hasTime: boolean;
  timeAdjust: TimeAdjust | null;
  pillars: Pillar[];
  dayGan: number;
  zodiac: number;
  elements: number[];
  strength: { score: number; label: string; strong: boolean };
  yongsin: Element;
  yongsinInfo: { eokbu: Element; johu: Element | null; basis: "억부" | "조후"; reason: string };
  groups: Record<string, number>;
  daYun: DaYunItem[];
  daYunStartAge: number;
  sinsal: { name: string; desc: string }[];
  relations: Relation[];
}

const PILLAR_LABEL = { year: "년주", month: "월주", day: "일주", time: "시주" } as const;

/** 입력한 날짜를 양력 Solar 객체로 변환한다. 서머타임·경도 보정 포함. */
export function toSolarWithAdjust(p: Profile): { solar: Solar; jieqiSolar: Solar; adjust: TimeAdjust | null } {
  const h = p.hour ?? 12;
  const mi = p.hour === null ? 0 : (p.minute ?? 0);
  const base: Solar =
    p.calendar === "lunar"
      ? Lunar.fromYmdHms(p.year, p.leapMonth ? -p.month : p.month, p.day, h, mi, 0).getSolar()
      : Solar.fromYmdHms(p.year, p.month, p.day, h, mi, 0);
  const a = adjustBirthTime(
    base.getYear(), base.getMonth(), base.getDay(), base.getHour(), base.getMinute(),
    p.timeCorrection ? cityOf(p.city).lon : null,
  );
  const b = a.beijing;
  const jieqiSolar = Solar.fromYmdHms(b.y, b.m, b.d, b.h, b.mi, 0);
  if (p.hour === null) return { solar: base, jieqiSolar, adjust: null };
  return { solar: Solar.fromYmdHms(a.y, a.m, a.d, a.h, a.mi, 0), jieqiSolar, adjust: a };
}

export const toSolar = (p: Profile) => toSolarWithAdjust(p).solar;

/** 입력값이 실제로 존재하는 날짜인지 확인. 문제가 있으면 오류 메시지를 반환한다. */
export function validateProfile(p: Profile): string | null {
  if (!p.name.trim()) return "이름을 입력해 주세요.";
  if (p.year < 1900 || p.year > 2100) return "1900~2100년 사이만 지원합니다.";
  try {
    if (p.calendar === "solar") {
      const d = new Date(Date.UTC(p.year, p.month - 1, p.day));
      if (d.getUTCMonth() !== p.month - 1 || d.getUTCDate() !== p.day) return "존재하지 않는 날짜입니다.";
    } else {
      const l = Lunar.fromYmd(p.year, p.leapMonth ? -p.month : p.month, p.day);
      if (l.getDay() !== p.day) return "존재하지 않는 음력 날짜입니다.";
    }
  } catch {
    return p.leapMonth ? "해당 연도에 그 윤달이 없습니다." : "존재하지 않는 날짜입니다.";
  }
  return null;
}

export function yearGanZhi(year: number) {
  return { gan: (((year - 4) % 10) + 10) % 10, zhi: (((year - 4) % 12) + 12) % 12 };
}

export function computeSaju(p: Profile): SajuResult {
  const { solar, jieqiSolar, adjust } = toSolarWithAdjust(p);
  const lunar = solar.getLunar();
  // 일주·시주는 출생지의 태양시로, 년주·월주·대운은 절기와 같은 기준(UTC+8)의 출생 순간으로 계산한다
  const ec = lunar.getEightChar();
  ec.setSect(p.yajasi ? 2 : 1);
  const ecJieqi = jieqiSolar.getLunar().getEightChar();
  ecJieqi.setSect(p.yajasi ? 2 : 1);
  const hasTime = p.hour !== null;

  const raw: [Pillar["key"], string, string][] = [
    ["year", ecJieqi.getYear(), ecJieqi.getYearNaYin()],
    ["month", ecJieqi.getMonth(), ecJieqi.getMonthNaYin()],
    ["day", ec.getDay(), ec.getDayNaYin()],
    ["time", ec.getTime(), ec.getTimeNaYin()],
  ];
  const dayGan = ganIndex(ec.getDay()[0]);

  const pillars: Pillar[] = raw
    .filter(([k]) => hasTime || k !== "time")
    .map(([key, gz, nayin]) => {
      const gan = ganIndex(gz[0]);
      const zhi = zhiIndex(gz[1]);
      return {
        key,
        label: PILLAR_LABEL[key],
        gan,
        zhi,
        ganGod: key === "day" ? "일간" : tenGod(dayGan, gan),
        zhiGod: tenGod(dayGan, zhiMainGan(zhi)),
        hidden: ZHI_HIDDEN[zhi].map((g) => ({ gan: g, god: tenGod(dayGan, g) })),
        stage: twelveStage(dayGan, zhi),
        nayin: NAYIN_KO[nayin] ?? nayin,
      };
    });

  // 오행 분포 (천간·지지 각 1점)
  const elements = [0, 0, 0, 0, 0];
  for (const pl of pillars) {
    elements[GAN_ELEMENT[pl.gan]]++;
    elements[ZHI_ELEMENT[pl.zhi]]++;
  }

  // 십신 그룹 분포 (일간 제외)
  const groups: Record<string, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  for (const pl of pillars) {
    if (pl.key !== "day") groups[TEN_GOD_GROUP[pl.ganGod as TenGod]]++;
    groups[TEN_GOD_GROUP[pl.zhiGod]]++;
  }

  // 신강/신약: 일간을 돕는 오행(비겁·인성)의 가중 비율. 월지는 계절의 힘이 커서 가중치를 크게 준다.
  const dayEl = GAN_ELEMENT[dayGan];
  const helps = (el: number) => el === dayEl || el === (dayEl + 4) % 5;
  let support = 0;
  let total = 0;
  for (const pl of pillars) {
    if (pl.key !== "day") {
      total += 1;
      if (helps(GAN_ELEMENT[pl.gan])) support += 1;
    }
    const w = pl.key === "month" ? 3 : pl.key === "day" ? 1.5 : 1;
    total += w;
    if (helps(ZHI_ELEMENT[pl.zhi])) support += w;
  }
  const score = Math.round((support / total) * 100);
  const strong = score >= 50;
  const label =
    score >= 70 ? "극신강" : score >= 57 ? "신강" : score >= 50 ? "중화(약간 강)" : score >= 43 ? "중화(약간 약)" : score >= 30 ? "신약" : "극신약";

  // 억부 용신: 강하면 설기·극하는 오행 중 부족한 것, 약하면 생조하는 오행 중 부족한 것
  const candidates = strong ? [(dayEl + 1) % 5, (dayEl + 2) % 5, (dayEl + 3) % 5] : [(dayEl + 4) % 5, dayEl];
  const eokbu = candidates.reduce((a, b) => (elements[b] < elements[a] ? b : a)) as Element;
  const yongsinInfo = decideYongsin(pillars[1].zhi, elements, eokbu, candidates);
  const yongsin = yongsinInfo.basis === "조후" ? yongsinInfo.johu! : eokbu;

  // 대운
  const yun = ecJieqi.getYun(p.gender === "M" ? 1 : 0, p.yajasi ? 2 : 1);
  const birthYear = solar.getYear();
  const daYun: DaYunItem[] = yun
    .getDaYun(10)
    .slice(1)
    .map((d) => {
      const gan = ganIndex(d.getGanZhi()[0]);
      const zhi = zhiIndex(d.getGanZhi()[1]);
      return {
        gan,
        zhi,
        age: d.getStartYear() - birthYear,
        startYear: d.getStartYear(),
        ganGod: tenGod(dayGan, gan),
        zhiGod: tenGod(dayGan, zhiMainGan(zhi)),
      };
    });

  return {
    profile: p,
    solar: {
      year: solar.getYear(),
      month: solar.getMonth(),
      day: solar.getDay(),
      hour: solar.getHour(),
      minute: solar.getMinute(),
    },
    lunar: { year: lunar.getYear(), month: Math.abs(lunar.getMonth()), day: lunar.getDay(), leap: lunar.getMonth() < 0 },
    hasTime,
    timeAdjust: adjust,
    pillars,
    dayGan,
    zodiac: pillars[0].zhi,
    elements,
    strength: { score, label, strong },
    yongsin,
    yongsinInfo,
    groups,
    daYun,
    daYunStartAge: daYun[0]?.age ?? 0,
    sinsal: findSinsal(pillars, dayGan),
    relations: findRelations(pillars),
  };
}

const EL_NAME = ["목", "화", "토", "금", "수"];

/**
 * 조후(調候): 한여름(巳午未월)에는 열기를 식힐 수(水), 한겨울(亥子丑월)에는 언 땅을 녹일 화(火)가 필요하다.
 * 계절의 치우침이 심한데(해당 오행 0개) 그 기운이 없으면 조후를 억부보다 우선한다.
 */
function decideYongsin(monthZhi: number, elements: number[], eokbu: Element, candidates: number[]) {
  const summer = [5, 6, 7].includes(monthZhi);
  const winter = [11, 0, 1].includes(monthZhi);
  const johu: Element | null = summer && elements[4] <= 1 ? 4 : winter && elements[1] <= 1 ? 1 : null;
  if (johu === null)
    return { eokbu, johu, basis: "억부" as const, reason: `일간의 강약을 맞추는 ${EL_NAME[eokbu]} 기운이 가장 필요합니다 (억부 용신).` };
  const season = summer ? "무더운 여름" : "추운 겨울";
  if (johu === eokbu || elements[johu] === 0 || candidates.includes(johu))
    return {
      eokbu, johu, basis: "조후" as const,
      reason: `${season}에 태어나 ${EL_NAME[johu]} 기운으로 온도를 맞추는 것이 가장 급합니다 (조후 용신).`,
    };
  return {
    eokbu, johu, basis: "억부" as const,
    reason: `강약을 맞추는 ${EL_NAME[eokbu]} 기운이 용신이며, ${season} 생이라 ${EL_NAME[johu]} 기운도 보조로 도움이 됩니다.`,
  };
}

function findSinsal(pillars: Pillar[], dayGan: number) {
  const out: { name: string; desc: string }[] = [];
  const zhis = pillars.map((p) => p.zhi);
  const where = (z: number) => pillars.filter((p) => p.zhi === z).map((p) => p.label).join("·");
  const add = (name: string, targets: number[], desc: string) => {
    const hit = [...new Set(targets.filter((t) => zhis.includes(t)))];
    if (hit.length) out.push({ name: `${name} (${hit.map(where).join(", ")})`, desc });
  };

  add("천을귀인", TIANYI[dayGan], "어려울 때 귀인의 도움을 받는 가장 좋은 길신입니다.");
  const refs = [pillars[0].zhi, pillars[2].zhi];
  const groupsSeen = new Set(refs.map((z) => z % 4));
  for (const g of groupsSeen) {
    const [peach, horse, canopy] = PEACH_HORSE_CANOPY[g];
    add("도화살", [peach], "매력과 인기가 많아 사람을 끌어당깁니다. 예술·대인관계 분야에 유리합니다.");
    add("역마살", [horse], "이동과 변화가 많은 기운. 여행·해외·영업·유통과 인연이 깊습니다.");
    add("화개살", [canopy], "학문·종교·예술적 감수성이 깊고 혼자만의 시간을 즐깁니다.");
  }
  if (dayGan in YANGREN) add("양인살", [YANGREN[dayGan]], "강한 추진력과 승부욕. 잘 쓰면 큰 성취, 과하면 다툼에 주의.");
  const dayGz = `${pillars[2].gan}-${pillars[2].zhi}`;
  if (["6-4", "8-4", "6-10", "8-10", "4-10"].includes(dayGz))
    out.push({ name: "괴강살 (일주)", desc: "총명하고 결단력이 강해 리더의 기질이 있으나 고집을 경계해야 합니다." });
  // 중복 제거
  return out.filter((v, i, a) => a.findIndex((x) => x.name === v.name) === i);
}

function findRelations(pillars: Pillar[]): Relation[] {
  const out: Relation[] = [];
  for (let i = 0; i < pillars.length; i++) {
    for (let j = i + 1; j < pillars.length; j++) {
      const a = pillars[i];
      const b = pillars[j];
      const where = `${a.label}-${b.label}`;
      if (isGanHe(a.gan, b.gan)) out.push({ kind: "천간합", where, good: true });
      if (isGanChong(a.gan, b.gan)) out.push({ kind: "천간충", where, good: false });
      if (isZhiHe(a.zhi, b.zhi)) out.push({ kind: "육합", where, good: true });
      if (isSanHe(a.zhi, b.zhi)) out.push({ kind: "삼합(반합)", where, good: true });
      if (isZhiChong(a.zhi, b.zhi)) out.push({ kind: "충", where, good: false });
      if (isZhiXing(a.zhi, b.zhi)) out.push({ kind: "형", where, good: false });
      if (isZhiHai(a.zhi, b.zhi)) out.push({ kind: "해", where, good: false });
      if (isYuanJin(a.zhi, b.zhi)) out.push({ kind: "원진", where, good: false });
    }
  }
  return out;
}
