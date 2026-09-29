import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import Header from "@/components/Header";
import "./globals.css";

const sans = Noto_Sans_KR({ variable: "--font-sans-kr", subsets: ["latin"], weight: ["400", "500", "700"] });
const serif = Noto_Serif_KR({ variable: "--font-serif-kr", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "나의 운명 — 사주·궁합·오늘의 운세·만세력",
  description: "생년월일시로 보는 사주팔자, 궁합, 오늘의 운세와 만세력",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:py-10">{children}</main>
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          사주 풀이는 전통 명리학에 기반한 참고용 정보입니다. 입력한 정보는 이 기기의 브라우저에만 저장됩니다.
        </footer>
      </body>
    </html>
  );
}
