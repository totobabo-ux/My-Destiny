// lunar-javascript는 타입 정의를 제공하지 않으므로 사용하는 API만 최소한으로 선언한다.
declare module "lunar-javascript" {
  export interface Solar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getWeek(): number;
    toYmd(): string;
    toYmdHms(): string;
    getLunar(): Lunar;
    next(days: number): Solar;
  }
  export interface DaYun {
    getIndex(): number;
    getGanZhi(): string;
    getStartAge(): number;
    getEndAge(): number;
    getStartYear(): number;
    getEndYear(): number;
  }
  export interface Yun {
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    isForward(): boolean;
    getDaYun(n?: number): DaYun[];
  }
  export interface EightChar {
    setSect(sect: 1 | 2): void;
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearNaYin(): string;
    getMonthNaYin(): string;
    getDayNaYin(): string;
    getTimeNaYin(): string;
    getYun(gender: 0 | 1, sect?: 1 | 2): Yun;
  }
  export interface Lunar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getSolar(): Solar;
    getEightChar(): EightChar;
    getJieQi(): string;
    getJieQiTable(): Record<string, Solar>;
    getYearInGanZhiExact(): string;
    getMonthInGanZhiExact(): string;
    getDayInGanZhiExact(): string;
    getDayInGanZhi(): string;
    getYearShengXiao(): string;
    getDayYi(): string[];
    getDayJi(): string[];
    getDayPositionXiDesc(): string;
    getDayPositionCaiDesc(): string;
    getTimes(): { getTianShenLuck(): string }[];
  }
  export const Solar: {
    fromYmd(y: number, m: number, d: number): Solar;
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Solar;
  };
  export const Lunar: {
    fromYmd(y: number, m: number, d: number): Lunar;
    fromYmdHms(y: number, m: number, d: number, h: number, mi: number, s: number): Lunar;
  };
  export const LunarYear: {
    fromYear(y: number): { getLeapMonth(): number };
  };
}
