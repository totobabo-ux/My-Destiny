"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Profile } from "./saju/calc";

// 프로필은 서버 없이 브라우저 localStorage에만 저장한다.
const KEY = "my-destiny:profiles";
const ACTIVE_KEY = "my-destiny:active";
const EVENT = "my-destiny:change";

interface Store {
  profiles: Profile[];
  activeId: string | null;
}

const EMPTY: Store = { profiles: [], activeId: null };
let cacheRaw: string | null = null;
let cache: Store = EMPTY;

function read(): Store {
  let raw: string;
  try {
    raw = `${localStorage.getItem(KEY) ?? "[]"}|${localStorage.getItem(ACTIVE_KEY) ?? ""}`;
  } catch {
    return EMPTY;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    try {
      const profiles = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Profile[];
      const active = localStorage.getItem(ACTIVE_KEY);
      cache = { profiles, activeId: profiles.some((p) => p.id === active) ? active : (profiles[0]?.id ?? null) };
    } catch {
      cache = EMPTY;
    }
  }
  return cache;
}

function write(profiles: Profile[], activeId: string | null) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profiles));
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)에서는 무시
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useProfiles() {
  const store = useSyncExternalStore(subscribe, read, () => EMPTY);
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  const save = useCallback((p: Profile) => {
    const { profiles } = read();
    const next = profiles.some((x) => x.id === p.id) ? profiles.map((x) => (x.id === p.id ? p : x)) : [...profiles, p];
    write(next, p.id);
  }, []);

  const remove = useCallback((id: string) => {
    const { profiles, activeId } = read();
    const next = profiles.filter((x) => x.id !== id);
    write(next, activeId === id ? (next[0]?.id ?? null) : activeId);
  }, []);

  const setActive = useCallback((id: string) => write(read().profiles, id), []);

  const active = store.profiles.find((p) => p.id === store.activeId) ?? null;
  return { ...store, active, hydrated, save, remove, setActive };
}

export function newId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
