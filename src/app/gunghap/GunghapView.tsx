"use client";

import { useMemo, useState } from "react";
import ProfileForm from "@/components/ProfileForm";
import { Char, NeedProfile, SectionTitle } from "@/components/saju-ui";
import { useProfiles } from "@/lib/profiles";
import { type Profile, type SajuResult, computeSaju } from "@/lib/saju/calc";
import { computeCompat } from "@/lib/saju/compat";
import { ZODIAC } from "@/lib/saju/constants";

export default function GunghapView() {
  const { profiles, activeId, save, hydrated } = useProfiles();
  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // 선택하지 않았으면 A = 현재 프로필, B = 그 외 첫 번째 프로필
  const a = profiles.find((p) => p.id === (aId ?? activeId)) ?? profiles[0];
  const b = profiles.find((p) => p.id === bId) ?? profiles.find((p) => p.id !== a?.id);

  const result = useMemo(() => {
    if (!a || !b || a.id === b.id) return null;
    const sa = computeSaju(a);
    const sb = computeSaju(b);
    return { sa, sb, compat: computeCompat(sa, sb) };
  }, [a, b]);

  if (!hydrated) return null;
  if (!profiles.length) return <NeedProfile />;

  const onAdd = (p: Profile) => {
    // save()는 새 프로필을 활성화하므로, 기존 선택(A)을 고정해 둔다
    setAId(a?.id ?? null);
    save(p);
    setBId(p.id);
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <h1 className="mb-4 font-serif text-2xl font-bold">사주 궁합</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Select profiles={profiles} label="나" value={a?.id} onChange={setAId} />
          <span className="hidden pb-2 text-center text-accent sm:block">♥</span>
          {profiles.length > 1 && <Select profiles={profiles} label="상대방" value={b?.id} onChange={setBId} />}
        </div>
        {!adding ? (
          <button className="btn btn-ghost mt-3 w-full text-sm" onClick={() => setAdding(true)}>
            + 상대방 정보 새로 입력
          </button>
        ) : (
          <div className="mt-4 border-t border-line pt-4">
            <ProfileForm onSubmit={onAdd} onCancel={() => setAdding(false)} submitLabel="궁합 보기" />
          </div>
        )}
        {a && b && a.id === b.id && <p className="mt-3 text-sm text-accent">서로 다른 두 사람을 선택해 주세요.</p>}
      </section>

      {result && (
        <>
          <section className="card text-center">
            <div className="flex items-center justify-center gap-4 sm:gap-10">
              <Person s={result.sa} />
              <ScoreRing score={result.compat.score} />
              <Person s={result.sb} />
            </div>
            <p className="mt-4 font-serif text-2xl font-bold text-accent">{result.compat.grade}</p>
            <p className="mx-auto mt-2 max-w-xl leading-relaxed">{result.compat.summary}</p>
          </section>

          <section className="card">
            <SectionTitle sub="일간·배우자궁·띠·오행 보완을 종합한 결과">궁합 상세 풀이</SectionTitle>
            <ul className="space-y-4">
              {result.compat.items.map((it) => (
                <li key={it.title} className="flex gap-3">
                  <span
                    className={`mt-0.5 h-6 min-w-10 rounded-full px-2 text-center text-xs leading-6 font-bold tabular-nums ${
                      it.delta > 0 ? "bg-accent-soft text-accent" : it.delta < 0 ? "bg-surface-2 text-muted" : "bg-surface-2"
                    }`}
                  >
                    {it.delta > 0 ? `+${it.delta}` : it.delta}
                  </span>
                  <div>
                    <p className="font-bold">{it.title}</p>
                    <p className="text-sm leading-relaxed text-muted">{it.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function Select({ profiles, value, onChange, label }: { profiles: Profile[]; value?: string; onChange: (id: string) => void; label: string }) {
  return (
    <label className="block flex-1">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <select className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.year}.{p.month}.{p.day})
          </option>
        ))}
      </select>
    </label>
  );
}

function Person({ s }: { s: SajuResult }) {
  const day = s.pillars[2];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1">
        <Char gan={day.gan} size="sm" />
        <Char zhi={day.zhi} size="sm" />
      </div>
      <p className="font-bold">{s.profile.name}</p>
      <p className="text-xs text-muted">{ZODIAC[s.zodiac]}띠 · {s.profile.gender === "M" ? "남" : "여"}</p>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-3xl font-bold tabular-nums">{score}</span>
        <span className="text-[10px] text-muted">점</span>
      </div>
    </div>
  );
}
