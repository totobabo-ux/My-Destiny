import type { DaYunItem, Pillar, SajuResult } from "./calc";
import { type TenGod, GAN_ELEMENT, GAN_KO, TEN_GOD_GROUP, ZHI_ELEMENT, ZHI_KO, isZhiChong, isZhiHe, isSanHe } from "./constants";
import { TEN_GOD_LUCK } from "./interpret";

// 궁위론: 년주·월주 = 초년, 월지·일주 = 중년, 시주 = 말년.
// 여기에 해당 나이대에 지나가는 대운의 오행이 용신에 도움이 되는지를 더해 시기별 흐름을 본다.

type Group = "비겁" | "식상" | "재성" | "관성" | "인성";
type StageKey = "early" | "middle" | "late";

export interface LifeStage {
  key: StageKey;
  name: string;
  range: string;
  score: number;
  tier: 0 | 1 | 2;
  basis: string;
  mainGroup: Group;
  daYun: DaYunItem[];
  summary: string;
  groupText: string;
  flowText: string;
  advice: string;
}

const STAGES: { key: StageKey; name: string; from: number; to: number; range: string }[] = [
  { key: "early", name: "초년운", from: 0, to: 30, range: "태어나서 ~ 29세" },
  { key: "middle", name: "중년운", from: 30, to: 60, range: "30세 ~ 59세" },
  { key: "late", name: "말년운", from: 60, to: 100, range: "60세 이후" },
];

const STAGE_BONUS: Record<string, number> = {
  장생: 2, 관대: 2, 건록: 2, 제왕: 2, 목욕: 0, 양: 1, 태: 0, 쇠: -1, 병: -1, 사: -2, 묘: -1, 절: -2,
};

/** 시기별 · 가장 강한 십신 그룹별 풀이 */
const GROUP_BY_STAGE: Record<StageKey, Record<Group, string>> = {
  early: {
    비겁: "형제·친구와 함께 부대끼며 자라 독립심과 경쟁심이 일찍 자랍니다. 또래 사이에서 존재감이 크지만 자기 주장이 강해 부모와 부딪힐 수 있습니다.",
    식상: "재능과 끼가 일찍 드러나는 초년입니다. 예체능·말솜씨·창의력이 돋보이며, 틀에 박힌 공부보다 하고 싶은 일을 찾을 때 성과가 큽니다.",
    재성: "현실 감각이 빨리 트여 일찍 경제 활동이나 사회 경험을 쌓습니다. 공부보다 실전에서 배우는 것이 많고, 용돈 관리·아르바이트에서 수완을 보입니다.",
    관성: "규율과 책임감을 일찍 배우는 초년입니다. 엄한 가정 분위기나 이른 사회적 부담이 있을 수 있지만 그만큼 반듯하게 성장해 조직에서 인정받는 바탕이 됩니다.",
    인성: "부모와 윗사람의 보살핌을 받으며 학업운이 좋은 초년입니다. 배움에 대한 욕구가 커 공부·자격 취득에서 성과를 거두기 쉽습니다.",
  },
  middle: {
    비겁: "스스로의 힘으로 기반을 닦는 중년입니다. 독립·창업·동업 기회가 오지만 동료와 이익을 나눠야 하는 상황도 생기니 금전 관계를 분명히 하세요.",
    식상: "재능을 결과물로 만들어 내는 중년입니다. 전문 기술·콘텐츠·사업 아이디어로 이름을 알리고, 자녀와 관련된 기쁨도 기대할 수 있습니다.",
    재성: "재물의 흐름이 가장 활발한 시기입니다. 사업·투자·부동산 등으로 재산을 늘릴 기회가 많으며, 가정을 꾸리고 살림을 키우는 데 힘이 실립니다.",
    관성: "직장과 사회적 지위가 중심이 되는 중년입니다. 승진·책임 있는 자리를 맡게 되며 명예가 높아지지만, 업무 부담과 스트레스 관리가 과제입니다.",
    인성: "경험과 지식이 쌓여 전문가로 인정받는 중년입니다. 문서·계약·자격·부동산 관련 운이 좋고, 윗사람의 후원으로 자리가 안정됩니다.",
  },
  late: {
    비겁: "노년에도 스스로의 힘으로 활동하는 자립적인 말년입니다. 친구·동료와의 교류가 활력이 되며, 재산은 미리 정리해 두면 분쟁을 막을 수 있습니다.",
    식상: "여유와 즐거움이 있는 말년입니다. 취미·봉사·강연 등 하고 싶은 일을 하며 지내고, 자녀·후배의 덕을 보는 복이 있습니다.",
    재성: "모아 둔 재물로 풍족하게 지내는 말년입니다. 경제적 걱정이 적지만 욕심을 줄이고 베풀수록 더 편안해집니다.",
    관성: "명예와 품위를 지키는 말년입니다. 자녀가 사회적으로 자리를 잡아 자랑이 되며, 원로로서 존중받습니다. 건강 관리에 꾸준히 신경 쓰세요.",
    인성: "마음이 평안하고 학문·종교·예술로 깊어지는 말년입니다. 주변의 보살핌과 존경을 받으며 정신적으로 풍요롭게 지냅니다.",
  },
};

const TIER_TEXT: Record<StageKey, [string, string, string]> = {
  early: [
    "타고난 환경의 도움을 받아 순탄하게 성장하는 초년입니다.",
    "좋고 나쁨이 섞인 평범한 초년으로, 노력한 만큼 기반이 다져집니다.",
    "초년에 굴곡이나 환경의 어려움이 있을 수 있으나, 그 경험이 훗날 큰 자산이 됩니다.",
  ],
  middle: [
    "인생의 전성기가 뚜렷한 중년입니다. 이 시기에 이룬 성과가 평생의 기반이 됩니다.",
    "꾸준히 쌓아 가는 안정형 중년입니다. 무리한 확장보다 내실을 다지면 좋습니다.",
    "중년에 변동과 시련이 따를 수 있습니다. 건강과 재정을 보수적으로 관리하면 고비를 넘깁니다.",
  ],
  late: [
    "갈수록 운이 좋아지는 복 있는 말년입니다. 편안하고 여유로운 노후가 기대됩니다.",
    "무난하고 평온한 말년입니다. 건강과 인간관계를 잘 챙기면 편안합니다.",
    "말년에 외로움이나 건강 문제가 생기기 쉬우니 미리 준비하고 가까운 사람과의 관계를 소중히 하세요.",
  ],
};

const ADVICE: Record<Group, string> = {
  비겁: "혼자 모든 것을 짊어지기보다 믿을 만한 사람과 역할을 나누세요.",
  식상: "생각을 행동으로 옮기고, 말보다 결과로 보여 주세요.",
  재성: "들어온 만큼 지키는 습관이 중요합니다. 계획적인 저축과 분산 투자를 권합니다.",
  관성: "책임감은 강점이지만 스스로를 몰아세우지 마세요. 휴식도 실력입니다.",
  인성: "배운 것을 실천으로 옮길 때 운이 커집니다. 생각이 많아질 땐 작은 것부터 시작하세요.",
};

/** 오행이 용신에게 얼마나 도움이 되는가: 용신 +2, 희신 +1, 한신 0, 구신 -1, 기신 -2 */
function elementValue(el: number, yong: number) {
  const diff = (el - yong + 5) % 5;
  return [2, 0, -1, -2, 1][diff];
}

export function computeLifeStages(s: SajuResult): LifeStage[] {
  const pillar = (k: Pillar["key"]) => s.pillars.find((p) => p.key === k);
  const dayZhi = pillar("day")!.zhi;

  return STAGES.map((st) => {
    // 이 시기에 해당하는 원국의 자리. 시간을 모르면 말년은 일지로 대신 본다.
    const chars: { el: number; god: TenGod | null; zhi?: number; stage?: string }[] = [];
    const add = (p: Pillar | undefined, useGan = true, useZhi = true) => {
      if (!p) return;
      if (useGan) chars.push({ el: GAN_ELEMENT[p.gan], god: p.ganGod === "일간" ? null : p.ganGod });
      if (useZhi) chars.push({ el: ZHI_ELEMENT[p.zhi], god: p.zhiGod, zhi: p.zhi, stage: p.stage });
    };
    let basis: string;
    if (st.key === "early") {
      add(pillar("year"));
      add(pillar("month"), true, false);
      basis = "년주 · 월간";
    } else if (st.key === "middle") {
      add(pillar("month"), false, true);
      add(pillar("day"));
      basis = "월지 · 일주";
    } else if (s.hasTime) {
      add(pillar("time"));
      basis = "시주";
    } else {
      add(pillar("day"), false, true);
      basis = "일지 (시간 모름)";
    }

    const daYun = s.daYun.filter((d) => d.age < st.to && d.age + 10 > st.from);

    // 원국 점수: 오행의 용신 기여 + 일간의 12운성 + 일지와의 합·충
    let natal = 0;
    for (const c of chars) {
      natal += elementValue(c.el, s.yongsin);
      if (c.stage) natal += STAGE_BONUS[c.stage] ?? 0;
      if (c.zhi !== undefined && st.key !== "middle") {
        if (isZhiHe(c.zhi, dayZhi) || isSanHe(c.zhi, dayZhi)) natal += 1;
        if (isZhiChong(c.zhi, dayZhi)) natal -= 2;
      }
    }
    natal /= Math.max(chars.length, 1);

    // 대운 점수: 지지(계절의 힘)를 천간보다 크게 본다
    let luck = 0;
    for (const d of daYun) {
      luck += elementValue(GAN_ELEMENT[d.gan], s.yongsin) + 1.5 * elementValue(ZHI_ELEMENT[d.zhi], s.yongsin);
      if (isZhiChong(d.zhi, dayZhi)) luck -= 1;
    }
    luck /= Math.max(daYun.length, 1) * 2.5;

    const score = Math.round(Math.max(40, Math.min(96, 71 + natal * 9 + luck * 14)));
    const tier: 0 | 1 | 2 = score >= 78 ? 0 : score >= 60 ? 1 : 2;

    // 가장 두드러진 십신 그룹 (원국 자리 2점, 대운 1점)
    const count: Record<Group, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
    for (const c of chars) if (c.god) count[TEN_GOD_GROUP[c.god] as Group] += 2;
    for (const d of daYun) {
      count[TEN_GOD_GROUP[d.ganGod] as Group] += 1;
      count[TEN_GOD_GROUP[d.zhiGod] as Group] += 1;
    }
    const mainGroup = (Object.keys(count) as Group[]).reduce((a, b) => (count[b] > count[a] ? b : a));

    const best = [...daYun].sort(
      (a, b) =>
        elementValue(ZHI_ELEMENT[b.zhi], s.yongsin) + elementValue(GAN_ELEMENT[b.gan], s.yongsin) -
        (elementValue(ZHI_ELEMENT[a.zhi], s.yongsin) + elementValue(GAN_ELEMENT[a.gan], s.yongsin)),
    )[0];
    const flowText = daYun.length
      ? `이 시기에는 ${daYun.map((d) => `${GAN_KO[d.gan]}${ZHI_KO[d.zhi]}(${d.age}세)`).join(" → ")} 대운이 흐릅니다.` +
        (best && elementValue(ZHI_ELEMENT[best.zhi], s.yongsin) > 0
          ? ` 특히 ${best.age}세부터 10년간은 용신의 힘을 받아 ${TEN_GOD_LUCK[best.zhiGod].keyword}의 기회가 커집니다.`
          : " 용신의 도움이 크지 않은 흐름이라 무리한 도전보다 준비와 내실이 중요합니다.")
      : "첫 대운이 들기 전의 시기로, 타고난 원국의 기운이 그대로 작용합니다.";

    return {
      key: st.key,
      name: st.name,
      range: st.range,
      score,
      tier,
      basis,
      mainGroup,
      daYun,
      summary: TIER_TEXT[st.key][tier],
      groupText: GROUP_BY_STAGE[st.key][mainGroup],
      flowText,
      advice: ADVICE[mainGroup],
    };
  });
}
