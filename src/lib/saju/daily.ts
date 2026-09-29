import { type Lunar, Solar } from "lunar-javascript";
import type { SajuResult } from "./calc";
import {
  type Element,
  type TenGod,
  ELEMENT_KO,
  ELEMENT_NUMBERS,
  GAN_ELEMENT,
  ZHI_ELEMENT,
  ZHI_KO,
  ganIndex,
  isYuanJin,
  isZhiChong,
  isZhiHai,
  isZhiHe,
  isZhiXing,
  isSanHe,
  tenGod,
  zhiIndex,
  zhiMainGan,
} from "./constants";
import { TEN_GOD_LUCK } from "./interpret";

export const CATEGORIES = ["총운", "재물운", "애정운", "건강운", "직장·학업운"] as const;
type Category = (typeof CATEGORIES)[number];

/** 십신별 분야 기본 점수 [총운, 재물, 애정, 건강, 직장] */
export const BASE: Record<TenGod, number[]> = {
  비견: [68, 58, 62, 74, 66],
  겁재: [60, 50, 58, 68, 62],
  식신: [78, 72, 74, 80, 70],
  상관: [66, 66, 64, 62, 58],
  편재: [74, 82, 72, 64, 70],
  정재: [76, 84, 74, 70, 72],
  편관: [62, 60, 64, 56, 70],
  정관: [78, 70, 76, 70, 84],
  편인: [64, 58, 60, 64, 72],
  정인: [76, 66, 70, 76, 82],
};

const TEXTS: Record<Category, [string[], string[], string[]]> = {
  총운: [
    ["기운이 활짝 열리는 날입니다. 미뤄 둔 일을 시작하면 좋은 결과가 따릅니다.", "주변의 도움과 행운이 겹치는 날, 적극적으로 움직여 보세요.", "하는 일마다 순조롭게 풀리는 날입니다. 자신감을 가지세요."],
    ["평온하고 무난한 하루입니다. 계획대로 차근차근 진행하세요.", "큰 변화는 없지만 작은 성취가 쌓이는 날입니다.", "무리하지 않고 흐름을 따르면 편안한 하루가 됩니다."],
    ["예상치 못한 변수가 생길 수 있으니 여유를 두고 움직이세요.", "서두르면 실수가 생기기 쉬운 날입니다. 한 번 더 확인하세요.", "기운이 가라앉는 날입니다. 중요한 결정은 하루 미뤄도 좋습니다."],
  ],
  재물운: [
    ["금전 흐름이 좋아 뜻밖의 수입이나 좋은 거래 기회가 있습니다.", "재물운이 상승하는 날, 계획해 둔 투자나 거래를 검토해 보세요.", "노력의 대가가 돈으로 돌아오는 날입니다."],
    ["수입과 지출이 균형을 이루는 날입니다.", "큰 이익은 없지만 손해도 없는 안정적인 흐름입니다.", "필요한 곳에만 쓰면 무난한 하루입니다."],
    ["충동구매나 불필요한 지출을 조심하세요.", "돈을 빌려주거나 보증을 서는 일은 피하세요.", "지갑이 쉽게 열리는 날입니다. 예산을 정해 두세요."],
  ],
  애정운: [
    ["매력이 빛나는 날, 좋은 인연을 만나거나 관계가 깊어집니다.", "연인·배우자와 따뜻한 시간을 보내기 좋은 날입니다.", "마음을 표현하면 기대 이상의 반응이 돌아옵니다."],
    ["잔잔하고 편안한 관계가 이어집니다.", "작은 배려 하나가 관계를 더 단단하게 만듭니다.", "특별한 일은 없어도 서로에게 안정감을 주는 날입니다."],
    ["말 한마디에 오해가 생길 수 있으니 부드럽게 표현하세요.", "상대의 기분을 먼저 살피면 다툼을 피할 수 있습니다.", "감정이 예민해지기 쉬운 날, 한 박자 쉬고 대화하세요."],
  ],
  건강운: [
    ["컨디션이 좋아 활동량을 늘리기 좋은 날입니다.", "몸과 마음이 가벼워 운동을 시작하기 좋습니다.", "에너지가 넘치는 하루입니다."],
    ["무난한 컨디션입니다. 규칙적인 식사를 챙기세요.", "가벼운 스트레칭으로 몸을 풀어 주면 좋습니다.", "충분한 수면이 내일의 컨디션을 좌우합니다."],
    ["피로가 쌓이기 쉬운 날, 무리한 일정은 피하세요.", "작은 부상이나 소화 불량에 주의하세요.", "스트레스 관리가 필요한 날입니다. 휴식을 우선하세요."],
  ],
  "직장·학업운": [
    ["능력을 인정받거나 좋은 평가를 받을 수 있는 날입니다.", "집중력이 높아 공부와 업무 성과가 좋습니다.", "윗사람의 신뢰를 얻는 날, 의견을 적극적으로 내 보세요."],
    ["맡은 일을 성실히 하면 무난히 마무리됩니다.", "새로운 일보다 기존 업무를 정리하기 좋은 날입니다.", "협업이 원활하게 이뤄지는 하루입니다."],
    ["윗사람·동료와의 마찰에 주의하세요.", "실수가 생기기 쉬우니 서류와 일정을 재확인하세요.", "집중이 흐트러지는 날, 중요한 일은 오전에 처리하세요."],
  ],
};

export interface DailyResult {
  date: string;
  ganzhi: { gan: number; zhi: number };
  ganGod: TenGod;
  zhiGod: TenGod;
  scores: { category: Category; score: number; text: string }[];
  headline: string;
  relationNote: string | null;
  lucky: Lucky;
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function computeDaily(saju: SajuResult, y: number, m: number, d: number): DailyResult {
  const lunar = Solar.fromYmd(y, m, d).getLunar();
  const gz = lunar.getDayInGanZhi();
  const gan = ganIndex(gz[0]);
  const zhi = zhiIndex(gz[1]);
  const ganGod = tenGod(saju.dayGan, gan);
  const zhiGod = tenGod(saju.dayGan, zhiMainGan(zhi));
  const myDayZhi = saju.pillars[2].zhi;

  let adj = 0;
  let relationNote: string | null = null;
  if (isZhiHe(myDayZhi, zhi)) {
    adj += 8;
    relationNote = `오늘의 일진(${ZHI_KO[zhi]})이 내 일지(${ZHI_KO[myDayZhi]})와 육합을 이룹니다. 사람과의 인연·협력이 잘 풀리는 날입니다.`;
  } else if (isSanHe(myDayZhi, zhi)) {
    adj += 5;
    relationNote = `오늘의 일진(${ZHI_KO[zhi]})이 내 일지(${ZHI_KO[myDayZhi]})와 삼합을 이룹니다. 뜻이 맞는 사람과 힘을 모으기 좋습니다.`;
  } else if (isZhiChong(myDayZhi, zhi)) {
    adj -= 10;
    relationNote = `오늘의 일진(${ZHI_KO[zhi]})이 내 일지(${ZHI_KO[myDayZhi]})와 충합니다. 이동·변동수가 있으니 교통안전과 감정 조절에 유의하세요.`;
  } else if (isYuanJin(myDayZhi, zhi) || isZhiXing(myDayZhi, zhi) || isZhiHai(myDayZhi, zhi)) {
    adj -= 4;
    relationNote = `오늘의 일진(${ZHI_KO[zhi]})이 내 일지(${ZHI_KO[myDayZhi]})와 약간 어긋납니다. 사소한 말다툼을 조심하세요.`;
  }
  // 용신 오행이 들어오면 가점, 용신을 극하는 오행이면 감점
  const todayEls = [GAN_ELEMENT[gan], ZHI_ELEMENT[zhi]];
  const enemy = (saju.yongsin + 3) % 5;
  adj += todayEls.filter((e) => e === saju.yongsin).length * 5;
  adj -= todayEls.filter((e) => e === enemy).length * 3;

  const seed = hash(`${saju.profile.id}-${y}-${m}-${d}`);
  const base = BASE[ganGod].map((v, i) => (v + BASE[zhiGod][i]) / 2);
  const scores = CATEGORIES.map((category, i) => {
    const jitter = ((seed >>> (i * 4)) & 15) - 7;
    const score = Math.round(Math.max(35, Math.min(98, base[i] + adj + jitter)));
    const tier = score >= 75 ? 0 : score >= 58 ? 1 : 2;
    const pool = TEXTS[category][tier];
    return { category, score, text: pool[(seed >>> (i * 3 + 1)) % pool.length] };
  });

  const lucky = computeLucky(saju, lunar, gan, zhi, seed);

  return {
    date: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    ganzhi: { gan, zhi },
    ganGod,
    zhiGod,
    scores,
    headline: `${TEN_GOD_LUCK[ganGod].keyword}의 날 — ${TEN_GOD_LUCK[ganGod].text}`,
    relationNote,
    lucky,
  };
}

// ── 오늘의 행운 ─────────────────────────────────────────────
// 용신·희신 중 오늘 일진에 부족한 기운을 고르고, 방향은 그날의 희신·재신 방위, 시간은 시진의 황도/흑도와
// 내 일지와의 합·충을 따져 날마다 달라지게 한다.

export interface Lucky {
  element: Element;
  reason: string;
  color: string;
  numbers: string;
  direction: string;
  wealthDirection: string;
  time: string;
  timeNote: string;
}

const SHADES: string[][] = [
  ["초록", "연두", "청록", "민트", "올리브"],
  ["빨강", "분홍", "주황", "자주", "코랄"],
  ["노랑", "베이지", "갈색", "황토", "카키"],
  ["흰색", "은색", "회색", "아이보리", "펄"],
  ["검정", "남색", "네이비", "진청", "차콜"],
];

const DIRECTION_KO: Record<string, string> = {
  正北: "북쪽", 东北: "북동쪽", 正东: "동쪽", 东南: "남동쪽",
  正南: "남쪽", 西南: "남서쪽", 正西: "서쪽", 西北: "북서쪽", 中宫: "중앙",
};

const pad2 = (n: number) => String(n).padStart(2, "0");

function computeLucky(saju: SajuResult, lunar: Lunar, gan: number, zhi: number, seed: number): Lucky {
  const yong = saju.yongsin;
  const hee = ((yong + 4) % 5) as Element; // 용신을 생해 주는 오행
  const enemy = (yong + 3) % 5; // 용신을 극하는 오행
  const todayEls: number[] = [GAN_ELEMENT[gan], ZHI_ELEMENT[zhi]];

  // 원국 + 오늘 일진을 합친 오행 분포에서 용신·희신 중 더 부족한 쪽을 오늘 보충할 기운으로 삼는다
  const total = saju.elements.map((n, i) => n + todayEls.filter((e) => e === i).length * 1.5);
  const element: Element =
    todayEls.includes(enemy) || total[yong] < total[hee] ? yong
      : total[hee] < total[yong] ? hee
        : seed % 2 ? yong : hee;
  const other = element === yong ? hee : yong;

  const todayText = `${ELEMENT_KO[GAN_ELEMENT[gan]]}·${ELEMENT_KO[ZHI_ELEMENT[zhi]]}`;
  const reason = todayEls.includes(enemy)
    ? `오늘은 용신을 누르는 ${ELEMENT_KO[enemy]} 기운이 들어오는 날이라, ${ELEMENT_KO[element]} 기운으로 힘을 보태야 합니다.`
    : todayEls.includes(element)
      ? `오늘 일진(${todayText})에 ${ELEMENT_KO[element]} 기운이 함께 들어와 흐름을 타기 좋은 날입니다.`
      : `오늘 일진(${todayText})에는 없는 ${ELEMENT_KO[element]} 기운을 보충하면 균형이 맞습니다.`;

  const main = SHADES[element][seed % 5];
  const sub = SHADES[other][(seed >>> 5) % 5];
  const n1 = ELEMENT_NUMBERS[element][(seed >>> 8) % 2];
  const n2 = ELEMENT_NUMBERS[other][(seed >>> 9) % 2];

  // 시진 고르기: 황도(吉) 여부 + 시지 오행의 용신 기여 + 내 일지·오늘 일지와의 합충
  const myDayZhi = saju.pillars[2].zhi;
  const times = lunar.getTimes().slice(0, 12); // 0번은 자시, 마지막 13번째(야자시)는 제외
  let best = { z: 0, score: -Infinity, good: false };
  times.forEach((t, z) => {
    const good = t.getTianShenLuck() === "吉";
    const el = ZHI_ELEMENT[z];
    let score = good ? 2 : 0;
    score += el === yong ? 2 : el === hee ? 1 : el === enemy ? -2 : 0;
    if (isZhiHe(myDayZhi, z) || isSanHe(myDayZhi, z)) score += 2;
    if (isZhiChong(myDayZhi, z)) score -= 3;
    if (isZhiChong(zhi, z)) score -= 2;
    score += ((seed >>> z) & 1) * 0.5; // 동점일 때 날마다 다르게
    if (score > best.score) best = { z, score, good };
  });
  const start = (best.z * 2 + 23) % 24;
  const timeReasons = [
    best.good && "황도길시",
    ZHI_ELEMENT[best.z] === yong && "용신 시간",
    ZHI_ELEMENT[best.z] === hee && "희신 시간",
    (isZhiHe(myDayZhi, best.z) || isSanHe(myDayZhi, best.z)) && "내 일지와 합",
  ].filter(Boolean);

  return {
    element,
    reason,
    color: `${main} · ${sub}`,
    numbers: `${n1}, ${n2}`,
    direction: DIRECTION_KO[lunar.getDayPositionXiDesc()] ?? lunar.getDayPositionXiDesc(),
    wealthDirection: DIRECTION_KO[lunar.getDayPositionCaiDesc()] ?? lunar.getDayPositionCaiDesc(),
    time: `${ZHI_KO[best.z]}시 (${pad2(start)}:00~${pad2((start + 2) % 24)}:00)`,
    timeNote: timeReasons.join(" · "),
  };
}
