import type { Metadata } from "next";
import FortuneView from "./FortuneView";

export const metadata: Metadata = { title: "신년·월별 운세" };

export default function Page() {
  return <FortuneView />;
}
