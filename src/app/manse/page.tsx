import type { Metadata } from "next";
import ManseView from "./ManseView";

export const metadata: Metadata = { title: "만세력" };

export default function Page() {
  return <ManseView />;
}
