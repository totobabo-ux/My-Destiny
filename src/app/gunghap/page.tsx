import type { Metadata } from "next";
import GunghapView from "./GunghapView";

export const metadata: Metadata = { title: "궁합" };

export default function Page() {
  return <GunghapView />;
}
