import type { Metadata } from "next";
import SajuView from "./SajuView";

export const metadata: Metadata = { title: "사주팔자" };

export default async function Page({ searchParams }: PageProps<"/saju">) {
  const { p } = await searchParams;
  return <SajuView shared={typeof p === "string" ? p : undefined} />;
}
