import type { Metadata } from "next";
import TodayView from "./TodayView";

export const metadata: Metadata = { title: "오늘의 운세" };

export default function Page() {
  return <TodayView />;
}
