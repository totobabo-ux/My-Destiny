"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ProfileForm from "@/components/ProfileForm";
import { useProfiles } from "@/lib/profiles";
import type { Profile } from "@/lib/saju/calc";

const MENUS = [
  { href: "/saju", hanja: "四柱", title: "사주팔자", desc: "타고난 기질·오행·대운 풀이" },
  { href: "/today", hanja: "日運", title: "오늘의 운세", desc: "일진으로 보는 하루의 흐름" },
  { href: "/fortune", hanja: "歲運", title: "신년·월별 운세", desc: "올해 총운과 12개월 흐름·삼재" },
  { href: "/gunghap", hanja: "宮合", title: "궁합", desc: "두 사람의 사주 궁합 점수" },
  { href: "/manse", hanja: "萬歲曆", title: "만세력", desc: "양력·음력·간지·절기 달력" },
];

export default function Home({ startNew }: { startNew: boolean }) {
  const router = useRouter();
  const { profiles, activeId, save, remove, setActive, hydrated } = useProfiles();
  const [editing, setEditing] = useState<Profile | "new" | null>(startNew ? "new" : null);
  const showForm = editing !== null || (hydrated && profiles.length === 0);

  const onSubmit = (p: Profile) => {
    save(p);
    setEditing(null);
    router.push("/saju");
  };

  return (
    <div className="space-y-8">
      <section className="text-center">
        <p className="font-serif text-5xl font-bold text-accent sm:text-6xl">命</p>
        <h1 className="mt-3 font-serif text-2xl font-bold sm:text-3xl">나의 운명을 읽다</h1>
        <p className="mt-2 text-muted">생년월일시로 풀어 보는 사주 · 궁합 · 오늘의 운세 · 만세력</p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MENUS.map((m) => (
          <Link key={m.href} href={m.href} className="card group transition hover:border-accent">
            <p className="font-serif text-2xl font-bold text-accent">{m.hanja}</p>
            <p className="mt-2 font-bold">{m.title}</p>
            <p className="text-xs text-muted">{m.desc}</p>
          </Link>
        ))}
      </section>

      {hydrated && (
        <section className="card">
          {showForm ? (
            <>
              <h2 className="mb-4 font-serif text-xl font-bold">
                {editing && editing !== "new" ? "정보 수정" : "내 정보 입력"}
              </h2>
              <ProfileForm
                key={editing && editing !== "new" ? editing.id : "new"}
                initial={editing && editing !== "new" ? editing : undefined}
                onSubmit={onSubmit}
                onCancel={profiles.length ? () => setEditing(null) : undefined}
              />
            </>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold">저장된 사람</h2>
                <button className="btn text-sm" onClick={() => setEditing("new")}>+ 새로 입력</button>
              </div>
              <ul className="divide-y divide-line">
                {profiles.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 py-3">
                    <button
                      className="flex-1 text-left"
                      onClick={() => {
                        setActive(p.id);
                        router.push("/saju");
                      }}
                    >
                      <span className="font-bold">{p.name}</span>
                      {p.id === activeId && <span className="ml-2 rounded bg-accent-soft px-1.5 py-0.5 text-xs text-accent">선택됨</span>}
                      <span className="block text-sm text-muted">
                        {p.gender === "M" ? "남" : "여"} · {p.calendar === "solar" ? "양력" : p.leapMonth ? "음력(윤)" : "음력"} {p.year}년 {p.month}월 {p.day}일
                        {p.hour !== null ? ` ${String(p.hour).padStart(2, "0")}:${String(p.minute ?? 0).padStart(2, "0")}` : " · 시간 모름"}
                      </span>
                    </button>
                    <button className="text-sm text-muted hover:text-ink" onClick={() => setEditing(p)}>수정</button>
                    <button
                      className="text-sm text-muted hover:text-accent"
                      onClick={() => confirm(`${p.name}님의 정보를 삭제할까요?`) && remove(p.id)}
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}
