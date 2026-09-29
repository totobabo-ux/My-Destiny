import { describe, expect, it } from "vitest";
import { type Profile, computeSaju, validateProfile } from "./calc";
import { computeCompat } from "./compat";
import { GAN, ZHI, tenGod, twelveStage, zhiMainGan } from "./constants";
import { DAY_PILLAR_TEXT } from "./daypillars";
import { computeDaily } from "./daily";
import { computeLifeStages } from "./lifestages";
import { adjustBirthTime } from "./time";

const profile = (over: Partial<Profile>): Profile => ({
  id: "t",
  name: "테스트",
  gender: "M",
  calendar: "solar",
  leapMonth: false,
  year: 1990,
  month: 5,
  day: 15,
  hour: 14,
  minute: 30,
  timeCorrection: true,
  city: "seoul",
  yajasi: false,
  ...over,
});

const pillarsOf = (p: Profile) => computeSaju(p).pillars.map((x) => GAN[x.gan] + ZHI[x.zhi]);

/** Node 내장 IANA 데이터로 특정 순간의 서울 UTC 오프셋(분)을 구한다 */
function intlSeoulOffset(utcMs: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul", hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return Math.round((wall - utcMs) / 60000);
}

describe("시각 보정", () => {
  it("1908~2030년 매일 정오의 한국 UTC 오프셋이 IANA tz 데이터와 일치한다", () => {
    const mismatches: string[] = [];
    for (let t = Date.UTC(1908, 3, 2, 12); t < Date.UTC(2030, 0, 1); t += 86400000) {
      const d = new Date(t);
      const a = adjustBirthTime(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), 12, 0, null);
      const utc = t - a.utcOffset * 60000;
      if (intlSeoulOffset(utc) !== a.utcOffset) mismatches.push(d.toISOString().slice(0, 10));
    }
    expect(mismatches).toEqual([]);
  });

  it("1987년 서머타임 기간 출생은 1시간을 되돌린다", () => {
    const a = adjustBirthTime(1987, 7, 1, 10, 0, null);
    expect(a.dst).toBe(true);
    expect([a.h, a.mi]).toEqual([9, 0]);
  });

  it("서울 경도 보정은 약 -32분", () => {
    const a = adjustBirthTime(2000, 1, 1, 12, 0, 126.98);
    expect(a.deltaMinutes).toBe(-32);
  });

  it("1954~61년(UTC+8:30 시기)에는 서울 경도 보정이 약 -2분", () => {
    const a = adjustBirthTime(1958, 1, 10, 12, 0, 126.98);
    expect(a.utcOffset).toBe(510);
    expect(a.deltaMinutes).toBe(-2);
  });
});

describe("사주 원국", () => {
  it("1990-05-15 14:30 서울", () => {
    expect(pillarsOf(profile({}))).toEqual(["庚午", "辛巳", "庚辰", "癸未"]);
  });

  it("2000-01-01 일주는 戊午", () => {
    expect(pillarsOf(profile({ year: 2000, month: 1, day: 1, hour: 12, minute: 0 }))[2]).toBe("戊午");
  });

  it("입춘(2024-02-04 17:27 KST) 직전·직후로 년주가 바뀐다", () => {
    const before = pillarsOf(profile({ year: 2024, month: 2, day: 4, hour: 17, minute: 0 }));
    const after = pillarsOf(profile({ year: 2024, month: 2, day: 4, hour: 17, minute: 50 }));
    expect(before.slice(0, 2)).toEqual(["癸卯", "乙丑"]);
    expect(after.slice(0, 2)).toEqual(["甲辰", "丙寅"]);
  });

  it("음력 윤달 입력: 2020년 윤4월 10일 = 양력 2020-06-01", () => {
    const s = computeSaju(profile({ calendar: "lunar", leapMonth: true, year: 2020, month: 4, day: 10, hour: null, minute: null }));
    expect([s.solar.year, s.solar.month, s.solar.day]).toEqual([2020, 6, 1]);
    expect(s.pillars).toHaveLength(3);
  });

  it("23시 출생: 기본은 다음 날 일주, 야자시면 당일 일주", () => {
    const base = { year: 2000, month: 1, day: 1, hour: 23, minute: 50, timeCorrection: false };
    expect(pillarsOf(profile(base))[2]).toBe("己未");
    expect(pillarsOf(profile({ ...base, yajasi: true }))[2]).toBe("戊午");
  });

  it("없는 날짜·윤달은 거부한다", () => {
    expect(validateProfile(profile({ month: 2, day: 30 }))).not.toBeNull();
    expect(validateProfile(profile({ calendar: "lunar", leapMonth: true, year: 2021, month: 4, day: 1 }))).not.toBeNull();
    expect(validateProfile(profile({}))).toBeNull();
  });
});

describe("명리 테이블", () => {
  it("십신", () => {
    expect(tenGod(0, 0)).toBe("비견"); // 甲-甲
    expect(tenGod(0, 3)).toBe("상관"); // 甲-丁
    expect(tenGod(6, 3)).toBe("정관"); // 庚-丁
    expect(tenGod(6, 1)).toBe("정재"); // 庚-乙
    expect(tenGod(9, 6)).toBe("정인"); // 癸-庚
  });

  it("12운성", () => {
    expect(twelveStage(0, 11)).toBe("장생"); // 甲 亥
    expect(twelveStage(0, 3)).toBe("제왕"); // 甲 卯
    expect(twelveStage(1, 6)).toBe("장생"); // 乙 午
    expect(twelveStage(6, 6)).toBe("목욕"); // 庚 午
    expect(twelveStage(9, 0)).toBe("건록"); // 癸 子
  });

  it("조후: 한여름 생에 수(水)가 없으면 수를 용신으로", () => {
    // 1994-07-01 12:00 = 甲戌년 庚午월 — 수 기운이 거의 없는 여름 사주
    const s = computeSaju(profile({ year: 1994, month: 7, day: 1, hour: 12, minute: 0 }));
    if (s.elements[4] === 0) expect(s.yongsin).toBe(4);
    expect(s.yongsinInfo.johu).toBe(4);
  });
});

describe("운세 계산은 결정적이고 범위를 지킨다", () => {
  const a = computeSaju(profile({}));
  const b = computeSaju(profile({ id: "b", gender: "F", year: 1992, month: 8, day: 23, hour: 7, minute: 45 }));

  it("궁합 점수 범위", () => {
    const c = computeCompat(a, b);
    expect(c.score).toBeGreaterThanOrEqual(35);
    expect(c.score).toBeLessThanOrEqual(98);
  });

  it("오늘의 운세: 같은 날은 같은 결과, 다른 날은 다른 행운", () => {
    expect(computeDaily(a, 2026, 9, 29)).toEqual(computeDaily(a, 2026, 9, 29));
    const days = [26, 27, 28, 29, 30].map((d) => JSON.stringify(computeDaily(a, 2026, 9, d).lucky));
    expect(new Set(days).size).toBeGreaterThan(1);
  });

  it("초년·중년·말년운 3단계", () => {
    const ls = computeLifeStages(a);
    expect(ls.map((x) => x.key)).toEqual(["early", "middle", "late"]);
    ls.forEach((x) => expect(x.score).toBeGreaterThanOrEqual(40));
  });
});

describe("일주론", () => {
  it("60갑자가 모두 있고, 본문에 적힌 일지 십신이 실제 계산과 같다", () => {
    for (let i = 0; i < 60; i++) {
      const key = GAN[i % 10] + ZHI[i % 12];
      const entry = DAY_PILLAR_TEXT[key];
      expect(entry, key).toBeDefined();
      const claim = entry.text.match(/(비견|겁재|식신|상관|편재|정재|편관|정관|편인|정인)\(/)?.[1];
      if (claim) expect(claim, key).toBe(tenGod(i % 10, zhiMainGan(i % 12)));
    }
  });
});
