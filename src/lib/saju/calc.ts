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
  /** 한국 표준시(동경 135°)와 실제 경도(약 127°) 차이 보정: -30분 */
  timeCorrection: boolean;
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
  pillars: Pillar[];
  dayGan: number;
  zodiac: number;
  elements: number[];
  strength: { score: number; label: string; strong: boolean };
  yongsin: Element;
  groups: Record<string, number>;
  daYun: DaYunItem[];
  daYunStartAge: number;
  sinsal: { name: string; desc: string }[];
  relations: Relation[];
}

const PILLAR_LABEL = { year: "년주", month: "월주", day: "일주", time: "시주" } as const;

/** 입력한 날짜를 양력 Solar 객체로 변환한다. 시간 보정 포함. */
export function toSolar(p: Profile): Solar {
  const h = p.hour ?? 12;
  const mi = p.hour === null ? 0 : (p.minute ?? 0);
  let base: Solar =
    p.calendar === "lunar"
      ? Lunar.fromYmdHms(p.year, p.leapMonth ? -p.month : p.month, p.day, h, mi, 0).getSolar()
      : Solar.fromYmdHms(p.year, p.month, p.day, h, mi, 0);
  if (p.timeCorrection && p.hour !== null) {
    const d = new Date(Date.UTC(base.getYear(), base.getMonth() - 1, base.getDay(), base.getHour(), base.getMinute() - 30));
    base = Solar.fromYmdHms(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), 0);
  }
  return base;
}

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
  const solar = toSolar(p);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  ec.setSect(p.yajasi ? 2 : 1);
  const hasTime = p.hour !== null;

  const raw: [Pillar["key"], string, string][] = [
    ["year", ec.getYear(), ec.getYearNaYin()],
    ["month", ec.getMonth(), ec.getMonthNaYin()],
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
  const yongsin = candidates.reduce((a, b) => (elements[b] < elements[a] ? b : a)) as Element;

  // 대운
  const yun = ec.getYun(p.gender === "M" ? 1 : 0, p.yajasi ? 2 : 1);
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
    pillars,
    dayGan,
    zodiac: pillars[0].zhi,
    elements,
    strength: { score, label, strong },
    yongsin,
    groups,
    daYun,
    daYunStartAge: daYun[0]?.age ?? 0,
    sinsal: findSinsal(pillars, dayGan),
    relations: findRelations(pillars),
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
