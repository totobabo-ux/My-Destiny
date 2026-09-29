import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "나의 운명 — 사주·궁합·오늘의 운세·만세력",
    short_name: "나의 운명",
    description: "생년월일시로 보는 사주팔자, 궁합, 오늘의 운세와 만세력",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e7",
    theme_color: "#a8322a",
    lang: "ko",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
