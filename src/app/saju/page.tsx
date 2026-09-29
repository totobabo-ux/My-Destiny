import type { Metadata } from "next";
import SajuView from "./SajuView";

export const metadata: Metadata = { title: "사주팔자 — 나의 운명" };

export default function Page() {
  return <SajuView />;
}
