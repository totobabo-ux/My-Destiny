import { type Profile, validateProfile } from "./saju/calc";

// 공유 링크: 프로필을 짧은 배열로 만들어 base64url로 URL에 담는다. 서버에는 저장하지 않는다.
type Packed = [string, "M" | "F", 0 | 1, 0 | 1, number, number, number, number | null, number | null, 0 | 1, string, 0 | 1];

function toBase64Url(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeProfile(p: Profile): string {
  const packed: Packed = [
    p.name, p.gender, p.calendar === "lunar" ? 1 : 0, p.leapMonth ? 1 : 0,
    p.year, p.month, p.day, p.hour, p.minute,
    p.timeCorrection ? 1 : 0, p.city ?? "seoul", p.yajasi ? 1 : 0,
  ];
  return toBase64Url(JSON.stringify(packed));
}

export function decodeProfile(code: string): Profile | null {
  try {
    const a = JSON.parse(fromBase64Url(code)) as Packed;
    if (!Array.isArray(a) || a.length !== 12) return null;
    const p: Profile = {
      id: `shared-${code.slice(0, 16)}`,
      name: String(a[0]).slice(0, 20),
      gender: a[1] === "M" ? "M" : "F",
      calendar: a[2] ? "lunar" : "solar",
      leapMonth: !!a[3],
      year: Number(a[4]),
      month: Number(a[5]),
      day: Number(a[6]),
      hour: a[7] === null ? null : Number(a[7]),
      minute: a[8] === null ? null : Number(a[8]),
      timeCorrection: !!a[9],
      city: String(a[10]),
      yajasi: !!a[11],
    };
    if (p.hour !== null && (p.hour < 0 || p.hour > 23)) return null;
    return validateProfile(p) ? null : p;
  } catch {
    return null;
  }
}

/** 모바일은 공유 시트, 데스크톱은 클립보드 복사. 결과 메시지를 반환한다. */
export async function shareUrl(url: string, title: string): Promise<string> {
  // 데스크톱 브라우저도 navigator.share를 제공하지만(Windows 공유 창), 데스크톱에서는 링크 복사가 더 자연스럽다
  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (touch && typeof navigator.share === "function") {
    try {
      await navigator.share({ title, url });
      return "";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "";
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "링크를 복사했습니다.";
  } catch {
    window.prompt("아래 링크를 복사하세요", url);
    return "";
  }
}
