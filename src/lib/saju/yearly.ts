import { yearGanZhi, type SajuResult } from "./calc";
import {
  type TenGod,
  GAN_ELEMENT,
  GAN_KO,
  SAMJAE,
  ZHI_ELEMENT,
  ZHI_KO,
  elementValue,
  isSanHe,
  isYuanJin,
  isZhiChong,
  isZhiHe,
  isZhiXing,
  tenGod,
  zhiMainGan,
} from "./constants";
import { BASE, CATEGORIES } from "./daily";
import { TEN_GOD_LUCK } from "./interpret";

// 신년운세: 그 해의 세운 간지가 내 일간에 어떤 십신인지, 용신에 도움이 되는지, 일지와 합·충하는지,
// 그리고 그 해에 흐르는 대운의 기운을 함께 본다. 월운은 절기 기준 12개월(인월~축월).

const YEAR_TEXTS: Record<(typeof CATEGORIES)[number], [string, string, string]> = {
  총운: [
    "한 해의 흐름이 크게 열립니다. 계획해 둔 일을 과감히 추진하면 눈에 띄는 성과가 따릅니다.",
    "큰 기복 없이 안정적인 한 해입니다. 꾸준함이 결과를 만들어 내니 페이스를 유지하세요.",
    "변수가 많은 해입니다. 확장보다는 수비, 새 출발보다는 준비에 무게를 두면 무난히 지나갑니다.",
  ],
  재물운: [
    "재물운이 상승하는 해입니다. 수입이 늘거나 좋은 투자·거래 기회가 찾아옵니다.",
    "수입과 지출의 균형이 맞는 해입니다. 계획적인 저축이 내년의 여유를 만듭니다.",
    "지출이 커지거나 돈이 묶이기 쉽습니다. 보증·고위험 투자는 피하고 현금 흐름을 지키세요.",
  ],
  애정운: [
    "인연운이 강하게 들어옵니다. 솔로는 좋은 만남, 커플은 관계의 진전이 기대됩니다.",
    "관계가 잔잔하게 이어지는 해입니다. 작은 이벤트와 대화가 정을 더 깊게 합니다.",
    "오해와 감정 소모가 생기기 쉽습니다. 서두르지 말고 상대의 속도에 맞춰 주세요.",
  ],
  건강운: [
    "활력이 넘치는 해입니다. 새 운동이나 생활 습관을 시작하기 좋습니다.",
    "무난한 컨디션이지만 과로가 쌓이지 않도록 주기적인 휴식을 챙기세요.",
    "체력이 떨어지기 쉬운 해입니다. 정기 검진과 수면·식사 관리를 우선하세요.",
  ],
  "직장·학업운": [
    "능력을 인정받는 해입니다. 승진·합격·이직 등 원하는 자리를 얻을 가능성이 큽니다.",
    "맡은 일에서 신뢰를 쌓는 해입니다. 실력을 다지면 다음 해에 기회로 돌아옵니다.",
    "업무 부담이나 경쟁이 커집니다. 무리한 변화보다 현재 자리에서 내실을 다지세요.",
  ],
};

const MONTH_TEXT: Record<TenGod, string> = {
  비견: "동료와 힘을 모으면 일이 수월합니다. 지출 관리는 필요합니다.",
  겁재: "경쟁과 지출이 늘어납니다. 돈 거래와 충동구매를 조심하세요.",
  식신: "여유와 즐거움이 있는 달. 새로운 취미·창작을 시작하기 좋습니다.",
  상관: "아이디어가 빛나지만 말실수에 주의. 윗사람과의 마찰을 피하세요.",
  편재: "활동 반경이 넓어지고 돈의 흐름이 활발합니다. 기회를 잡되 무리는 금물.",
  정재: "성실함이 수입으로 이어지는 달. 저축과 계획적인 소비에 좋습니다.",
  편관: "책임과 압박이 커지는 달. 건강과 안전에 유의하며 차분히 대응하세요.",
  정관: "인정과 좋은 소식이 기대되는 달. 공식적인 일·계약에 유리합니다.",
  편인: "직관이 예리해지는 달. 공부·기획에 좋지만 결정은 신중하게.",
  정인: "도움과 배움이 들어오는 달. 문서·자격·계약 운이 좋습니다.",
};

const MONTH_NAMES = ["인월", "묘월", "진월", "사월", "오월", "미월", "신월", "유월", "술월", "해월", "자월", "축월"];
const MONTH_JIEQI = ["입춘", "경칩", "청명", "입하", "망종", "소서", "입추", "백로", "한로", "입동", "대설", "소한"];

export interface MonthLuck {
  index: number;
  name: string;
  solarLabel: string;
  jieqi: string;
  gan: number;
  zhi: number;
  ganGod: TenGod;
  zhiGod: TenGod;
  score: number;
  keyword: string;
  text: string;
  note: string | null;
}

export interface YearlyResult {
  year: number;
  gan: number;
  zhi: number;
  ganGod: TenGod;
  zhiGod: TenGod;
  age: number;
  score: number;
  headline: string;
  details: string[];
  samjae: { kind: string; text: string } | null;
  categories: { category: string; score: number; text: string }[];
  months: MonthLuck[];
  bestMonths: MonthLuck[];
  cautionMonths: MonthLuck[];
}

const clamp = (n: number) => Math.round(Math.max(35, Math.min(97, n)));

function relationAdj(dayZhi: number, z: number) {
  if (isZhiHe(dayZhi, z)) return { adj: 6, kind: "합" as const };
  if (isSanHe(dayZhi, z)) return { adj: 4, kind: "삼합" as const };
  if (isZhiChong(dayZhi, z)) return { adj: -8, kind: "충" as const };
  if (isYuanJin(dayZhi, z) || isZhiXing(dayZhi, z)) return { adj: -3, kind: "형·원진" as const };
  return { adj: 0, kind: null };
}

export function computeYearly(s: SajuResult, year: number): YearlyResult {
  const { gan, zhi } = yearGanZhi(year);
  const ganGod = tenGod(s.dayGan, gan);
  const zhiGod = tenGod(s.dayGan, zhiMainGan(zhi));
  const dayZhi = s.pillars[2].zhi;
  const yong = s.yongsin;
  const details: string[] = [];

  // 용신 기여 (지지가 계절·환경의 힘이라 천간보다 크게)
  const elAdj = elementValue(GAN_ELEMENT[gan], yong) * 3 + elementValue(ZHI_ELEMENT[zhi], yong) * 4;
  if (elAdj >= 6) details.push("올해의 기운이 나에게 필요한 용신을 채워 주어 힘을 받는 해입니다.");
  else if (elAdj <= -6) details.push("올해의 기운이 용신과 어긋나 노력에 비해 결과가 더디게 느껴질 수 있습니다.");

  const rel = relationAdj(dayZhi, zhi);
  if (rel.kind === "합" || rel.kind === "삼합")
    details.push(`올해 지지(${ZHI_KO[zhi]})가 내 일지(${ZHI_KO[dayZhi]})와 ${rel.kind}하여 인간관계·결혼·협업에 좋은 인연이 생깁니다.`);
  if (rel.kind === "충")
    details.push(`올해 지지(${ZHI_KO[zhi]})가 내 일지(${ZHI_KO[dayZhi]})와 충하여 이사·이직·관계 변화 등 변동수가 큽니다. 변화는 신중하게 선택하세요.`);
  if (rel.kind === "형·원진") details.push("일지와 형·원진이 걸려 가까운 사람과 신경전이 생기기 쉽습니다.");

  // 그 해의 대운
  const dy = [...s.daYun].reverse().find((d) => d.startYear <= year);
  let dyAdj = 0;
  if (dy) {
    dyAdj = (elementValue(GAN_ELEMENT[dy.gan], yong) + 1.5 * elementValue(ZHI_ELEMENT[dy.zhi], yong)) * 1.5;
    details.push(
      `${GAN_KO[dy.gan]}${ZHI_KO[dy.zhi]} 대운(${dy.age}세~) 안에 있는 해로, 큰 흐름은 ${TEN_GOD_LUCK[dy.zhiGod].keyword}의 기운${
        dyAdj > 1 ? "이 뒷받침해 줍니다." : dyAdj < -1 ? "이라 무리한 확장은 피하는 것이 좋습니다." : "이 바탕에 깔립니다."
      }`,
    );
  }

  // 삼재
  const sj = SAMJAE[s.pillars[0].zhi % 4].indexOf(zhi);
  const samjae =
    sj >= 0
      ? {
          kind: ["들삼재", "눌삼재", "날삼재"][sj],
          text: [
            "삼재가 들어오는 첫해입니다. 새로운 일을 벌이기보다 건강·안전·계약을 꼼꼼히 챙기세요.",
            "삼재의 한가운데입니다. 무리한 투자·이동을 삼가고 현상 유지에 힘쓰면 무난합니다.",
            "삼재가 나가는 해입니다. 하반기로 갈수록 운이 풀리니 조급해하지 마세요.",
          ][sj],
        }
      : null;
  const sjAdj = sj === 1 ? -4 : sj >= 0 ? -2 : 0;

  const adj = elAdj + rel.adj + dyAdj + sjAdj;
  const base = BASE[ganGod].map((v, i) => (v + BASE[zhiGod][i]) / 2);
  const categories = CATEGORIES.map((category, i) => {
    const score = clamp(base[i] + adj);
    const tier = score >= 75 ? 0 : score >= 58 ? 1 : 2;
    return { category, score, text: YEAR_TEXTS[category][tier] };
  });

  // 월운: 인월(寅)부터. 월간은 년간으로 정해진다 (갑기년 병인월 시작 …)
  const firstMonthGan = ((gan % 5) * 2 + 2) % 10;
  const months: MonthLuck[] = MONTH_NAMES.map((name, i) => {
    const mg = (firstMonthGan + i) % 10;
    const mz = (2 + i) % 12;
    const mGanGod = tenGod(s.dayGan, mg);
    const mZhiGod = tenGod(s.dayGan, zhiMainGan(mz));
    const r = relationAdj(dayZhi, mz);
    const mAdj = elementValue(GAN_ELEMENT[mg], yong) * 2.5 + elementValue(ZHI_ELEMENT[mz], yong) * 3.5 + r.adj + adj * 0.3;
    const score = clamp((BASE[mGanGod][0] + BASE[mZhiGod][0]) / 2 + mAdj);
    const solarMonth = ((i + 1) % 12) + 1; // 인월 ≈ 양력 2월
    return {
      index: i,
      name,
      solarLabel: `${solarMonth}월`,
      jieqi: MONTH_JIEQI[i],
      gan: mg,
      zhi: mz,
      ganGod: mGanGod,
      zhiGod: mZhiGod,
      score,
      keyword: TEN_GOD_LUCK[mGanGod].keyword,
      text: MONTH_TEXT[mGanGod],
      note:
        r.kind === "충" ? "일지와 충: 이동·변동·다툼 주의"
          : r.kind === "합" || r.kind === "삼합" ? "일지와 합: 인연·협력에 좋음"
            : null,
    };
  });
  const sorted = [...months].sort((a, b) => b.score - a.score);

  return {
    year,
    gan,
    zhi,
    ganGod,
    zhiGod,
    age: year - s.solar.year,
    score: categories[0].score,
    headline: `${TEN_GOD_LUCK[ganGod].keyword}의 해 — ${TEN_GOD_LUCK[ganGod].text}`,
    details,
    samjae,
    categories,
    months,
    bestMonths: sorted.slice(0, 2),
    cautionMonths: sorted.slice(-2).reverse(),
  };
}
