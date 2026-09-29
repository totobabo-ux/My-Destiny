"use client";

import { useState } from "react";
import { type Profile, validateProfile } from "@/lib/saju/calc";
import { newId } from "@/lib/profiles";
import { CITIES, DEFAULT_CITY } from "@/lib/saju/time";

const empty = (): Profile => ({
  id: newId(),
  name: "",
  gender: "F",
  calendar: "solar",
  leapMonth: false,
  year: 1995,
  month: 1,
  day: 1,
  hour: 12,
  minute: 0,
  timeCorrection: true,
  city: DEFAULT_CITY,
  yajasi: false,
});

export default function ProfileForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "저장하고 보기",
}: {
  initial?: Profile;
  onSubmit: (p: Profile) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [p, setP] = useState<Profile>(initial ?? empty());
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((prev) => ({ ...prev, [k]: v }));
  const time = p.hour === null ? "" : `${String(p.hour).padStart(2, "0")}:${String(p.minute ?? 0).padStart(2, "0")}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateProfile(p);
    setError(err);
    if (!err) onSubmit({ ...p, name: p.name.trim() });
  };

  const seg = (active: boolean) =>
    `flex-1 rounded-md py-2 text-sm font-medium ${active ? "bg-accent text-white" : "text-muted hover:text-ink"}`;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-muted">이름</span>
          <input className="input" value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="홍길동" maxLength={20} />
        </label>
        <div>
          <span className="mb-1 block text-sm text-muted">성별</span>
          <div className="flex gap-1 rounded-lg border border-line bg-surface p-1">
            <button type="button" className={seg(p.gender === "F")} onClick={() => set("gender", "F")}>여성</button>
            <button type="button" className={seg(p.gender === "M")} onClick={() => set("gender", "M")}>남성</button>
          </div>
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm text-muted">생년월일</span>
        <div className="mb-2 flex gap-1 rounded-lg border border-line bg-surface p-1">
          <button type="button" className={seg(p.calendar === "solar")} onClick={() => setP({ ...p, calendar: "solar", leapMonth: false })}>양력</button>
          <button type="button" className={seg(p.calendar === "lunar" && !p.leapMonth)} onClick={() => setP({ ...p, calendar: "lunar", leapMonth: false })}>음력 (평달)</button>
          <button type="button" className={seg(p.calendar === "lunar" && p.leapMonth)} onClick={() => setP({ ...p, calendar: "lunar", leapMonth: true })}>음력 (윤달)</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select className="input" value={p.year} onChange={(e) => set("year", +e.target.value)} aria-label="년">
            {Array.from({ length: 201 }, (_, i) => 2100 - i).map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <select className="input" value={p.month} onChange={(e) => set("month", +e.target.value)} aria-label="월">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
          <select className="input" value={p.day} onChange={(e) => set("day", +e.target.value)} aria-label="일">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>{d}일</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className="mb-1 block text-sm text-muted">태어난 시간</span>
        <div className="flex items-center gap-3">
          <input
            type="time"
            className="input max-w-40"
            value={time}
            disabled={p.hour === null}
            onChange={(e) => {
              const [h, m] = e.target.value.split(":").map(Number);
              if (!Number.isNaN(h)) setP({ ...p, hour: h, minute: m || 0 });
            }}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={p.hour === null}
              onChange={(e) => setP({ ...p, hour: e.target.checked ? null : 12, minute: e.target.checked ? null : 0 })}
            />
            시간 모름
          </label>
        </div>
      </div>

      {p.hour !== null && (
        <label className="block">
          <span className="mb-1 block text-sm text-muted">태어난 지역</span>
          <select className="input" value={p.city ?? DEFAULT_CITY} onChange={(e) => set("city", e.target.value)}>
            {CITIES.map((c) => (
              <option key={c.key} value={c.key}>{c.name}</option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">
            지역의 경도로 실제 태양시를 계산합니다. 서머타임 기간(1948~60년, 1987~88년) 출생은 자동으로 1시간 보정됩니다.
          </span>
        </label>
      )}

      <details className="rounded-lg border border-line bg-surface-2/50 px-3 py-2 text-sm">
        <summary className="cursor-pointer text-muted">고급 설정</summary>
        <div className="mt-2 space-y-2">
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={p.timeCorrection} onChange={(e) => set("timeCorrection", e.target.checked)} />
            <span>
              경도(태양시) 보정
              <span className="block text-xs text-muted">한국 표준시는 동경 135° 기준이라 실제 태양시보다 약 30분 빠릅니다. 대부분의 한국 만세력이 적용합니다.</span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={p.yajasi} onChange={(e) => set("yajasi", e.target.checked)} />
            <span>
              야자시 적용
              <span className="block text-xs text-muted">23시~자정 출생을 다음 날이 아닌 당일 일주로 봅니다.</span>
            </span>
          </label>
        </div>
      </details>

      {error && <p className="rounded-md bg-accent-soft px-3 py-2 text-sm text-accent">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="btn flex-1">{submitLabel}</button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>취소</button>
        )}
      </div>
    </form>
  );
}
