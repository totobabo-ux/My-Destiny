// 천간·지지·오행 기본 테이블

export const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const GAN_KO = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"] as const;
export const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export const ZHI_KO = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"] as const;
export const ZODIAC = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"] as const;

/** 오행 인덱스: 0 목, 1 화, 2 토, 3 금, 4 수 */
export type Element = 0 | 1 | 2 | 3 | 4;
export const ELEMENT_KO = ["목", "화", "토", "금", "수"] as const;
export const ELEMENT_HANJA = ["木", "火", "土", "金", "水"] as const;
export const ELEMENT_COLOR_NAME = ["초록·청색", "빨강·분홍", "노랑·베이지", "흰색·은색", "검정·남색"] as const;
export const ELEMENT_NUMBERS = [[3, 8], [2, 7], [5, 10], [4, 9], [1, 6]] as const;
export const ELEMENT_DIRECTION = ["동쪽", "남쪽", "중앙", "서쪽", "북쪽"] as const;
export const ELEMENT_SEASON = ["봄", "여름", "환절기", "가을", "겨울"] as const;
/** UI 색상 (tailwind 임의값에 쓰기 위한 hex) */
export const ELEMENT_HEX = ["#2f9e64", "#e0473c", "#c9982b", "#8a8f98", "#2b4c8c"] as const;

export const GAN_ELEMENT: Element[] = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
/** 천간 음양: true = 양 */
export const GAN_YANG = (g: number) => g % 2 === 0;
export const ZHI_ELEMENT: Element[] = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];

/** 지장간 (여기 → 중기 → 정기 순). 마지막이 본기 */
export const ZHI_HIDDEN: number[][] = [
  [8, 9], // 子: 壬 癸
  [9, 7, 5], // 丑: 癸 辛 己
  [4, 2, 0], // 寅: 戊 丙 甲
  [0, 1], // 卯: 甲 乙
  [1, 9, 4], // 辰: 乙 癸 戊
  [4, 6, 2], // 巳: 戊 庚 丙
  [2, 5, 3], // 午: 丙 己 丁
  [3, 1, 5], // 未: 丁 乙 己
  [4, 8, 6], // 申: 戊 壬 庚
  [6, 7], // 酉: 庚 辛
  [7, 3, 4], // 戌: 辛 丁 戊
  [4, 0, 8], // 亥: 戊 甲 壬
];
export const zhiMainGan = (z: number) => ZHI_HIDDEN[z][ZHI_HIDDEN[z].length - 1];

export const TEN_GODS = [
  "비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인",
] as const;
export type TenGod = (typeof TEN_GODS)[number];

/** 일간(day)을 기준으로 대상 천간(target)의 십신 */
export function tenGod(day: number, target: number): TenGod {
  const diff = (GAN_ELEMENT[target] - GAN_ELEMENT[day] + 5) % 5;
  const same = GAN_YANG(day) === GAN_YANG(target);
  return TEN_GODS[diff * 2 + (same ? 0 : 1)];
}

/** 십신 그룹: 비겁·식상·재성·관성·인성 */
export const TEN_GOD_GROUP: Record<TenGod, string> = {
  비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상", 편재: "재성",
  정재: "재성", 편관: "관성", 정관: "관성", 편인: "인성", 정인: "인성",
};

const TWELVE_STAGES = ["장생", "목욕", "관대", "건록", "제왕", "쇠", "병", "사", "묘", "절", "태", "양"] as const;
/** 각 천간의 장생 지지 */
const CHANGSHENG = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];

/** 12운성: 천간이 지지에서 갖는 기운의 단계 */
export function twelveStage(gan: number, zhi: number): string {
  const start = CHANGSHENG[gan];
  const offset = GAN_YANG(gan) ? (zhi - start + 12) % 12 : (start - zhi + 12) % 12;
  return TWELVE_STAGES[offset];
}

export const ganIndex = (c: string) => GAN.indexOf(c as (typeof GAN)[number]);
export const zhiIndex = (c: string) => ZHI.indexOf(c as (typeof ZHI)[number]);

// ── 합·충·형·해 ──────────────────────────────
export const isGanHe = (a: number, b: number) => Math.abs(a - b) === 5;
export const GAN_HE_ELEMENT: Element[] = [2, 3, 4, 0, 1]; // 甲己土 乙庚金 丙辛水 丁壬木 戊癸火
export const isGanChong = (a: number, b: number) =>
  Math.abs(a - b) === 6 && Math.min(a, b) < 4;

const LIU_HE: [number, number][] = [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]];
const LIU_HAI: [number, number][] = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];
const YUAN_JIN: [number, number][] = [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]];
const XING: [number, number][] = [[2, 5], [5, 8], [2, 8], [1, 10], [10, 7], [1, 7], [0, 3]];
const pairIn = (list: [number, number][], a: number, b: number) =>
  list.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

export const isZhiHe = (a: number, b: number) => pairIn(LIU_HE, a, b);
export const isZhiChong = (a: number, b: number) => Math.abs(a - b) === 6;
export const isZhiHai = (a: number, b: number) => pairIn(LIU_HAI, a, b);
export const isYuanJin = (a: number, b: number) => pairIn(YUAN_JIN, a, b);
export const isZhiXing = (a: number, b: number) =>
  pairIn(XING, a, b) || (a === b && [4, 6, 9, 11].includes(a));
/** 삼합: 같은 그룹(지지 index % 4)에 속하면 반합 이상 */
export const isSanHe = (a: number, b: number) => a !== b && a % 4 === b % 4;
export const SAN_HE_ELEMENT: Element[] = [4, 3, 1, 0]; // 申子辰水, 巳酉丑金, 寅午戌火, 亥卯未木 (index % 4)

// ── 신살 ─────────────────────────────────────
/** 천을귀인: 일간 기준 */
export const TIANYI: number[][] = [
  [1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [2, 6], [5, 3], [5, 3],
];
/** 삼합 그룹(index % 4) → [도화, 역마, 화개] */
export const PEACH_HORSE_CANOPY: [number, number, number][] = [
  [9, 2, 4], // 申子辰
  [6, 11, 1], // 巳酉丑
  [3, 8, 10], // 寅午戌
  [0, 5, 7], // 亥卯未
];
/** 양인: 양간 기준 */
export const YANGREN: Record<number, number> = { 0: 3, 2: 6, 4: 6, 6: 9, 8: 0 };

export const JIEQI_KO: Record<string, string> = {
  立春: "입춘", 雨水: "우수", 惊蛰: "경칩", 春分: "춘분", 清明: "청명", 谷雨: "곡우",
  立夏: "입하", 小满: "소만", 芒种: "망종", 夏至: "하지", 小暑: "소서", 大暑: "대서",
  立秋: "입추", 处暑: "처서", 白露: "백로", 秋分: "추분", 寒露: "한로", 霜降: "상강",
  立冬: "입동", 小雪: "소설", 大雪: "대설", 冬至: "동지", 小寒: "소한", 大寒: "대한",
};

export const NAYIN_KO: Record<string, string> = {
  海中金: "해중금", 炉中火: "노중화", 大林木: "대림목", 路旁土: "노방토", 剑锋金: "검봉금",
  山头火: "산두화", 涧下水: "간하수", 城头土: "성두토", 白蜡金: "백랍금", 杨柳木: "양류목",
  泉中水: "천중수", 屋上土: "옥상토", 霹雳火: "벽력화", 松柏木: "송백목", 长流水: "장류수",
  砂中金: "사중금", 山下火: "산하화", 平地木: "평지목", 壁上土: "벽상토", 金箔金: "금박금",
  覆灯火: "복등화", 天河水: "천하수", 大驿土: "대역토", 钗钏金: "차천금", 桑柘木: "상자목",
  大溪水: "대계수", 沙中土: "사중토", 天上火: "천상화", 石榴木: "석류목", 大海水: "대해수",
};

export const ganKo = (g: number) => GAN_KO[g];
export const zhiKo = (z: number) => ZHI_KO[z];

/** 오행이 용신에 얼마나 도움이 되는가: 용신 +2, 희신 +1, 한신 0, 구신 -1, 기신 -2 */
export function elementValue(el: number, yong: number) {
  return [2, 0, -1, -2, 1][(el - yong + 5) % 5];
}

/** 삼재: 띠(년지) 삼합 그룹별로 3년간 드는 해의 지지 [들삼재, 눌삼재, 날삼재] */
export const SAMJAE: number[][] = [
  [2, 3, 4], // 申子辰 띠 → 寅卯辰년
  [11, 0, 1], // 巳酉丑 띠 → 亥子丑년
  [8, 9, 10], // 寅午戌 띠 → 申酉戌년
  [5, 6, 7], // 亥卯未 띠 → 巳午未년
];
