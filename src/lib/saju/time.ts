// 출생 시각 보정: 당시 한국 시계 시각 → UTC → 출생지 경도 기준 평균 태양시
// 근거: IANA tz database의 Asia/Seoul 규칙 (표준시 변경 이력과 서머타임)

export interface City {
  key: string;
  name: string;
  lon: number;
}

export const CITIES: City[] = [
  { key: "seoul", name: "서울", lon: 126.98 },
  { key: "incheon", name: "인천", lon: 126.7 },
  { key: "suwon", name: "수원·경기 남부", lon: 127.03 },
  { key: "uijeongbu", name: "의정부·경기 북부", lon: 127.05 },
  { key: "chuncheon", name: "춘천", lon: 127.73 },
  { key: "wonju", name: "원주", lon: 127.95 },
  { key: "gangneung", name: "강릉", lon: 128.9 },
  { key: "cheongju", name: "청주", lon: 127.49 },
  { key: "chungju", name: "충주", lon: 127.93 },
  { key: "daejeon", name: "대전·세종", lon: 127.38 },
  { key: "cheonan", name: "천안", lon: 127.15 },
  { key: "jeonju", name: "전주", lon: 127.15 },
  { key: "gunsan", name: "군산", lon: 126.74 },
  { key: "gwangju", name: "광주", lon: 126.85 },
  { key: "mokpo", name: "목포", lon: 126.39 },
  { key: "yeosu", name: "여수·순천", lon: 127.66 },
  { key: "daegu", name: "대구", lon: 128.6 },
  { key: "andong", name: "안동", lon: 128.73 },
  { key: "pohang", name: "포항", lon: 129.37 },
  { key: "gyeongju", name: "경주", lon: 129.22 },
  { key: "ulsan", name: "울산", lon: 129.31 },
  { key: "busan", name: "부산", lon: 129.08 },
  { key: "changwon", name: "창원·마산", lon: 128.68 },
  { key: "jinju", name: "진주", lon: 128.11 },
  { key: "jeju", name: "제주", lon: 126.53 },
  { key: "seogwipo", name: "서귀포", lon: 126.56 },
  { key: "pyongyang", name: "평양", lon: 125.75 },
];

export const DEFAULT_CITY = "seoul";
export const cityOf = (key?: string) => CITIES.find((c) => c.key === key) ?? CITIES[0];

/** 벽시계 시각을 분 단위 정수로 (월 1~12) */
const wall = (y: number, m: number, d: number, h = 0, mi = 0) => Date.UTC(y, m - 1, d, h, mi) / 60000;

/** 한국 표준시의 UTC 오프셋(분). 1954-03-21 ~ 1961-08-09에는 동경 127.5° 기준(UTC+8:30)이었다. */
function standardOffset(t: number) {
  if (t < wall(1908, 4, 1)) return 508; // 서울 지방평균시 UTC+8:27:52
  if (t < wall(1912, 1, 1)) return 510;
  if (t < wall(1954, 3, 21)) return 540;
  if (t < wall(1961, 8, 10)) return 510;
  return 540;
}

/** 서머타임 기간 [시작, 끝) — 벽시계(표준시) 기준 */
const DST: [number, number][] = [
  [wall(1948, 6, 1), wall(1948, 9, 13)],
  [wall(1949, 4, 3), wall(1949, 9, 11)],
  [wall(1950, 4, 1), wall(1950, 9, 10)],
  [wall(1951, 5, 6), wall(1951, 9, 9)],
  [wall(1955, 5, 5), wall(1955, 9, 9)],
  [wall(1956, 5, 20), wall(1956, 9, 30)],
  [wall(1957, 5, 5), wall(1957, 9, 22)],
  [wall(1958, 5, 4), wall(1958, 9, 21)],
  [wall(1959, 5, 3), wall(1959, 9, 20)],
  [wall(1960, 5, 1), wall(1960, 9, 18)],
  [wall(1987, 5, 10, 2), wall(1987, 10, 11, 3)],
  [wall(1988, 5, 8, 2), wall(1988, 10, 9, 3)],
];

export const isDst = (t: number) => DST.some(([s, e]) => t >= s && t < e);

export interface TimeAdjust {
  /** 보정 후 벽시계 값 */
  y: number;
  m: number;
  d: number;
  h: number;
  mi: number;
  /** 입력 시각 대비 총 보정량(분) */
  deltaMinutes: number;
  dst: boolean;
  utcOffset: number;
  /** 출생 순간을 베이징 표준시(UTC+8) 벽시계로 표현한 값. 라이브러리의 절기 시각이 UTC+8 기준이라 년·월주 판정에 쓴다. */
  beijing: { y: number; m: number; d: number; h: number; mi: number };
  notes: string[];
}

/**
 * 입력한 한국 시계 시각을 사주 계산용 시각으로 바꾼다.
 * - 서머타임 기간이면 항상 1시간을 되돌린다 (실제 시계가 1시간 빨랐으므로).
 * - longitude가 주어지면 평균 태양시(UTC + 경도×4분)로 바꾼다.
 */
export function adjustBirthTime(
  y: number, m: number, d: number, h: number, mi: number, longitude: number | null,
): TimeAdjust {
  const t = wall(y, m, d, h, mi);
  const dst = isDst(t);
  const utcOffset = standardOffset(t) + (dst ? 60 : 0);
  const notes: string[] = [];
  if (dst) notes.push("서머타임 -60분");

  let target: number;
  if (longitude === null) {
    target = t - (dst ? 60 : 0);
  } else {
    const lmtOffset = Math.round(longitude * 4);
    target = t - utcOffset + lmtOffset;
    const lonDelta = lmtOffset - standardOffset(t);
    notes.push(`경도 보정 ${lonDelta >= 0 ? "+" : ""}${lonDelta}분`);
  }
  const out = new Date(target * 60000);
  const bj = new Date((t - utcOffset + 480) * 60000);
  return {
    y: out.getUTCFullYear(),
    m: out.getUTCMonth() + 1,
    d: out.getUTCDate(),
    h: out.getUTCHours(),
    mi: out.getUTCMinutes(),
    deltaMinutes: target - t,
    dst,
    utcOffset,
    beijing: { y: bj.getUTCFullYear(), m: bj.getUTCMonth() + 1, d: bj.getUTCDate(), h: bj.getUTCHours(), mi: bj.getUTCMinutes() },
    notes,
  };
}

/** 베이징 표준시(UTC+8) 벽시계 시각을 당시 한국 시계 시각 "HH:MM"으로 바꾼다 (절입 시각 표시용). */
export function beijingToKoreaHm(y: number, m: number, d: number, h: number, mi: number) {
  const utc = wall(y, m, d, h, mi) - 480;
  let local = utc + standardOffset(utc + 540);
  if (isDst(local)) local += 60;
  const out = new Date(local * 60000);
  return `${String(out.getUTCHours()).padStart(2, "0")}:${String(out.getUTCMinutes()).padStart(2, "0")}`;
}
