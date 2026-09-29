import type { SajuResult } from "./calc";
import {
  ELEMENT_KO,
  GAN_ELEMENT,
  GAN_HE_ELEMENT,
  GAN_KO,
  ZHI_ELEMENT,
  ZHI_KO,
  ZODIAC,
  isGanChong,
  isGanHe,
  isSanHe,
  isYuanJin,
  isZhiChong,
  isZhiHai,
  isZhiHe,
  isZhiXing,
  elementValue,
} from "./constants";

export interface CompatItem {
  title: string;
  delta: number;
  text: string;
}

export interface CompatArea {
  area: string;
  score: number;
  text: string;
}

export interface CompatPeriod {
  year: number;
  ageA: number;
  ageB: number;
  goodA: boolean;
  goodB: boolean;
  label: string;
  text: string;
}

export interface CompatResult {
  score: number;
  grade: string;
  summary: string;
  items: CompatItem[];
  areas: CompatArea[];
  timeline: CompatPeriod[];
}

const AREA_TEXT: Record<string, [string, string, string]> = {
  "끌림·연애": [
    "첫눈에 끌리는 강한 인연입니다. 함께 있으면 설렘이 오래가고 표현도 자연스럽습니다.",
    "천천히 스며드는 관계입니다. 시간이 지날수록 편안함 속에 정이 깊어집니다.",
    "설렘보다는 차이가 먼저 보일 수 있습니다. 상대의 매력을 발견하려는 노력이 필요합니다.",
  ],
  "결혼·생활": [
    "생활 리듬과 가정에 대한 생각이 잘 맞아 함께 살수록 안정되는 궁합입니다.",
    "큰 충돌은 없지만 집안일·생활 습관은 미리 규칙을 정해 두면 좋습니다.",
    "생활 방식의 차이가 커서 사소한 일로 다투기 쉽습니다. 각자의 공간과 역할을 분명히 하세요.",
  ],
  "대화·소통": [
    "말이 잘 통하고 생각의 속도가 비슷합니다. 대화만으로도 문제를 풀어 가는 사이입니다.",
    "필요한 말은 통하지만 감정 표현 방식은 조금 다릅니다. 확인하는 습관이 도움이 됩니다.",
    "표현 방식이 달라 오해가 생기기 쉽습니다. 결론보다 감정을 먼저 들어 주세요.",
  ],
  "금전·가치관": [
    "돈을 대하는 태도와 삶의 우선순위가 비슷해 함께 재산을 모으기 좋습니다.",
    "씀씀이는 조금 다르지만 조율이 가능합니다. 공동 예산을 정해 두면 편합니다.",
    "소비·저축 성향이 달라 금전 문제로 부딪히기 쉽습니다. 경제권과 원칙을 분명히 하세요.",
  ],
};

const clampArea = (n: number) => Math.round(Math.max(35, Math.min(97, n)));
const hasPeach = (s: SajuResult) => s.sinsal.some((x) => x.name.startsWith("도화"));

function computeAreas(a: SajuResult, b: SajuResult): CompatArea[] {
  const ea = GAN_ELEMENT[a.dayGan];
  const eb = GAN_ELEMENT[b.dayGan];
  const sheng = (ea + 1) % 5 === eb || (eb + 1) % 5 === ea;
  const same = ea === eb;
  const dayRel = zhiRelation(a.pillars[2].zhi, b.pillars[2].zhi);
  const monthRel = zhiRelation(a.pillars[1].zhi, b.pillars[1].zhi);
  const relScore: Record<string, number> = { 육합: 10, 삼합: 7, 충: -10, 원진: -7, 형: -5, 해: -4 };

  let love = 66;
  if (isGanHe(a.dayGan, b.dayGan)) love += 16;
  else if (sheng) love += 8;
  else if (isGanChong(a.dayGan, b.dayGan)) love -= 8;
  if (hasPeach(a) || hasPeach(b)) love += 4;
  if (dayRel === "육합" || dayRel === "삼합") love += 5;

  let life = 66 + (dayRel ? relScore[dayRel] * 1.3 : 3) + (monthRel ? relScore[monthRel] * 0.5 : 0);
  if (Math.abs(a.strength.score - b.strength.score) >= 25) life += 3; // 강약이 다르면 역할 분담이 자연스럽다

  let talk = 66 + (same ? 8 : sheng ? 7 : isGanHe(a.dayGan, b.dayGan) ? 5 : -5);
  const ta = a.groups["식상"];
  const tb = b.groups["식상"];
  if (ta >= 1 && tb >= 1) talk += 4;
  if ((ta === 0 && tb >= 3) || (tb === 0 && ta >= 3)) talk -= 5;

  let money = 66;
  const wa = a.groups["재성"];
  const wb = b.groups["재성"];
  money += Math.abs(wa - wb) <= 1 ? 6 : -4;
  if (a.groups["비겁"] >= 3 || b.groups["비겁"] >= 3) money -= 5;
  if (b.elements[a.yongsin] >= 2) money += 3;
  if (a.elements[b.yongsin] >= 2) money += 3;

  return (
    [
      ["끌림·연애", love],
      ["결혼·생활", life],
      ["대화·소통", talk],
      ["금전·가치관", money],
    ] as [string, number][]
  ).map(([area, raw]) => {
    const score = clampArea(raw);
    return { area, score, text: AREA_TEXT[area][score >= 76 ? 0 : score >= 58 ? 1 : 2] };
  });
}

/** 앞으로 30년, 10년 단위로 두 사람의 대운이 각자의 용신에 도움이 되는지 비교 */
function computeTimeline(a: SajuResult, b: SajuResult, fromYear: number): CompatPeriod[] {
  const good = (s: SajuResult, year: number) => {
    const d = [...s.daYun].reverse().find((x) => x.startYear <= year);
    if (!d) return true;
    return elementValue(GAN_ELEMENT[d.gan], s.yongsin) + 1.5 * elementValue(ZHI_ELEMENT[d.zhi], s.yongsin) >= 0;
  };
  const an = a.profile.name;
  const bn = b.profile.name;
  return [0, 10, 20].map((off) => {
    const year = fromYear + off;
    const ga = good(a, year);
    const gb = good(b, year);
    const [label, text] =
      ga && gb
        ? ["함께 상승", "두 사람 모두 운이 받쳐 주는 시기입니다. 결혼·이사·사업 등 큰 결정을 함께 내리기 좋습니다."]
        : ga
          ? [`${an}님이 이끄는 시기`, `${an}님의 운이 좋은 반면 ${bn}님은 다소 힘든 시기입니다. ${an}님이 든든한 버팀목이 되어 주세요.`]
          : gb
            ? [`${bn}님이 이끄는 시기`, `${bn}님의 운이 좋은 반면 ${an}님은 다소 힘든 시기입니다. ${bn}님이 든든한 버팀목이 되어 주세요.`]
            : ["서로 의지할 시기", "두 사람 모두 운이 무거운 시기입니다. 큰 모험은 미루고 서로를 다독이며 내실을 다지세요."];
    return { year, ageA: year - a.solar.year, ageB: year - b.solar.year, goodA: ga, goodB: gb, label, text };
  });
}


function zhiRelation(a: number, b: number) {
  if (isZhiHe(a, b)) return "육합";
  if (isSanHe(a, b)) return "삼합";
  if (isZhiChong(a, b)) return "충";
  if (isYuanJin(a, b)) return "원진";
  if (isZhiXing(a, b)) return "형";
  if (isZhiHai(a, b)) return "해";
  return null;
}

export function computeCompat(a: SajuResult, b: SajuResult, fromYear = new Date().getFullYear()): CompatResult {
  const items: CompatItem[] = [];
  const an = a.profile.name;
  const bn = b.profile.name;

  // 1. 일간 관계 — 두 사람의 본질적인 기질
  const ga = a.dayGan;
  const gb = b.dayGan;
  const ea = GAN_ELEMENT[ga];
  const eb = GAN_ELEMENT[gb];
  const dayLabel = `일간 ${GAN_KO[ga]}${ELEMENT_KO[ea]} · ${GAN_KO[gb]}${ELEMENT_KO[eb]}`;
  if (isGanHe(ga, gb)) {
    items.push({
      title: `${dayLabel} — 천간합 (${ELEMENT_KO[GAN_HE_ELEMENT[Math.min(ga, gb)]]})`,
      delta: 14,
      text: "서로에게 자연스럽게 끌리는 최고의 인연입니다. 말하지 않아도 마음이 통하고, 함께 있으면 새로운 기운이 만들어집니다.",
    });
  } else if (isGanChong(ga, gb)) {
    items.push({
      title: `${dayLabel} — 천간충`,
      delta: -6,
      text: "가치관과 방식이 정반대라 부딪히기 쉽습니다. 다름을 인정하면 서로의 부족함을 채우는 자극제가 됩니다.",
    });
  } else if ((ea + 1) % 5 === eb || (eb + 1) % 5 === ea) {
    const giver = (ea + 1) % 5 === eb ? an : bn;
    const taker = giver === an ? bn : an;
    items.push({
      title: `${dayLabel} — 상생`,
      delta: 9,
      text: `${giver}님이 ${taker}님을 북돋아 주는 관계입니다. 한쪽이 베풀고 다른 쪽이 성장하며 편안한 신뢰가 쌓입니다.`,
    });
  } else if (ea === eb) {
    items.push({
      title: `${dayLabel} — 비화 (같은 오행)`,
      delta: 4,
      text: "비슷한 성향이라 친구처럼 편하고 말이 잘 통합니다. 다만 고집이 부딪히면 양보가 어려울 수 있습니다.",
    });
  } else {
    const ctrl = (ea + 2) % 5 === eb ? an : bn;
    items.push({
      title: `${dayLabel} — 상극`,
      delta: -3,
      text: `${ctrl}님이 주도하고 상대가 맞춰 주는 구도가 되기 쉽습니다. 일방적인 관계가 되지 않도록 배려가 필요합니다.`,
    });
  }

  // 2. 일지 관계 — 배우자궁, 생활 궁합
  const da = a.pillars[2].zhi;
  const db = b.pillars[2].zhi;
  const dayRel = zhiRelation(da, db);
  const DAY_REL: Record<string, [number, string]> = {
    육합: [12, "배우자궁이 육합으로 묶여 생활 리듬과 정서가 잘 맞습니다. 함께 살수록 정이 깊어지는 궁합입니다."],
    삼합: [8, "배우자궁이 삼합을 이루어 같은 목표를 향해 협력하는 동반자 관계입니다."],
    충: [-10, "배우자궁이 충돌하여 생활 방식 차이로 다툼이 생기기 쉽습니다. 각자의 공간과 시간을 존중하세요."],
    원진: [-7, "이유 없이 서운함이 쌓이기 쉬운 원진 관계입니다. 작은 감정도 바로 대화로 풀어 주세요."],
    형: [-5, "서로를 바꾸려는 마음이 갈등이 될 수 있습니다. 잔소리보다 칭찬이 효과적입니다."],
    해: [-4, "사소한 오해가 생기기 쉽습니다. 제3자의 말보다 서로의 말을 믿으세요."],
  };
  const dayTitle = `일지(배우자궁) ${ZHI_KO[da]} · ${ZHI_KO[db]}`;
  if (dayRel) items.push({ title: `${dayTitle} — ${dayRel}`, delta: DAY_REL[dayRel][0], text: DAY_REL[dayRel][1] });
  else items.push({ title: `${dayTitle} — 무난`, delta: 2, text: "배우자궁에 특별한 충돌이 없어 무난하고 안정적입니다." });

  // 3. 띠(년지) 궁합
  const ya = a.pillars[0].zhi;
  const yb = b.pillars[0].zhi;
  const yRel = zhiRelation(ya, yb);
  const Y_REL: Record<string, [number, string]> = {
    육합: [6, "띠 궁합이 육합으로, 집안 분위기와 가치관이 잘 어울립니다."],
    삼합: [6, "띠 궁합이 삼합으로, 서로의 가족·주변 사람들과도 잘 어울립니다."],
    충: [-5, "띠가 충하여 첫인상이나 주변의 반대가 있을 수 있으나 노력으로 극복 가능합니다."],
    원진: [-4, "띠가 원진이라 가끔 까닭 없이 서운할 수 있습니다."],
    형: [-2, "띠 사이에 형이 있어 사소한 기싸움이 생길 수 있습니다."],
    해: [-2, "띠 사이에 해가 있어 작은 오해에 주의하세요."],
  };
  const yTitle = `띠 궁합 ${ZODIAC[ya]}띠 · ${ZODIAC[yb]}띠`;
  if (yRel) items.push({ title: `${yTitle} — ${yRel}`, delta: Y_REL[yRel][0], text: Y_REL[yRel][1] });
  else items.push({ title: `${yTitle} — 무난`, delta: 1, text: "띠 사이에 특별한 충돌이 없습니다." });

  // 4. 오행 보완
  const aGets = b.elements[a.yongsin];
  const bGets = a.elements[b.yongsin];
  const fill = (who: string, other: string, el: number, n: number): CompatItem =>
    n >= 2
      ? { title: `${who}님에게 필요한 ${ELEMENT_KO[el]}(용신)을 ${other}님이 가짐`, delta: 6, text: `${other}님의 사주에 ${ELEMENT_KO[el]} 기운이 ${n}개 있어 ${who}님에게 부족한 기운을 채워 줍니다. 함께할수록 운이 트이는 관계입니다.` }
      : n === 1
        ? { title: `${who}님의 용신(${ELEMENT_KO[el]})을 ${other}님이 조금 보완`, delta: 2, text: `${other}님이 ${who}님에게 필요한 기운을 어느 정도 보태 줍니다.` }
        : { title: `${who}님의 용신(${ELEMENT_KO[el]}) 보완 없음`, delta: -2, text: `${other}님의 사주에는 ${who}님에게 필요한 ${ELEMENT_KO[el]} 기운이 없어 스스로 채워야 합니다.` };
  items.push(fill(an, bn, a.yongsin, aGets));
  items.push(fill(bn, an, b.yongsin, bGets));

  // 5. 월지 — 사회적·가정 환경
  const monthRel = zhiRelation(a.pillars[1].zhi, b.pillars[1].zhi);
  if (monthRel === "육합" || monthRel === "삼합")
    items.push({ title: `월지 ${monthRel}`, delta: 3, text: "성장 환경과 사회생활 방식이 비슷해 서로를 잘 이해합니다." });
  else if (monthRel === "충")
    items.push({ title: "월지 충", delta: -3, text: "자라 온 환경과 일하는 방식이 달라 조율이 필요합니다." });

  const raw = 62 + items.reduce((s, i) => s + i.delta, 0);
  const score = Math.max(35, Math.min(98, raw));
  const [grade, summary] =
    score >= 88
      ? ["천생연분", "하늘이 맺어 준 인연입니다. 서로를 자연스럽게 채워 주며 함께할수록 더 좋아지는 관계입니다."]
      : score >= 78
        ? ["아주 좋음", "서로에게 좋은 영향을 주는 궁합입니다. 작은 차이만 존중하면 오래도록 행복할 수 있습니다."]
        : score >= 66
          ? ["좋음", "무난하고 편안한 궁합입니다. 서로 노력하는 만큼 관계가 깊어집니다."]
          : score >= 55
            ? ["보통", "장단점이 공존하는 궁합입니다. 대화와 배려로 부족한 부분을 채워 가세요."]
            : ["노력 필요", "기질 차이가 커서 부딪힐 일이 많을 수 있습니다. 하지만 궁합은 참고일 뿐, 이해와 존중이 가장 큰 궁합입니다."];

  return { score, grade, summary, items, areas: computeAreas(a, b), timeline: computeTimeline(a, b, fromYear) };
}
