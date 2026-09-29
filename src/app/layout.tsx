import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/Header";
import "./globals.css";

const sans = Noto_Sans_KR({ variable: "--font-sans-kr", subsets: ["latin"], weight: ["400", "500", "700"] });
const serif = Noto_Serif_KR({ variable: "--font-serif-kr", subsets: ["latin"], weight: ["600", "700"] });

// 공유 미리보기(OG) 이미지는 절대 URL이 필요하다. Vercel에서는 운영 도메인을 자동으로 쓴다.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const description = "생년월일시로 보는 사주팔자, 궁합, 오늘의 운세, 신년·월별 운세와 만세력";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "나의 운명 — 사주·궁합·오늘의 운세·만세력", template: "%s — 나의 운명" },
  description,
  applicationName: "나의 운명",
  keywords: ["사주", "사주팔자", "궁합", "오늘의 운세", "신년운세", "만세력", "명리학"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "나의 운명",
    title: "나의 운명 — 사주·궁합·오늘의 운세·만세력",
    description,
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "나의 운명", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#14120f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:py-10">{children}</main>
        <footer className="border-t border-line py-6 text-center text-xs text-muted">
          <p>사주 풀이는 전통 명리학에 기반한 참고용 정보입니다. 입력한 정보는 이 기기의 브라우저에만 저장됩니다.</p>
          <Link href="/about" className="mt-2 inline-block underline underline-offset-2 hover:text-ink">
            서비스 안내 · 개인정보 처리 · 면책 고지
          </Link>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
