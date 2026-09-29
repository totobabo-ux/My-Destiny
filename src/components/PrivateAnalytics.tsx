"use client";

import { Analytics } from "@vercel/analytics/next";

// 방문 통계에는 경로만 보낸다. 예전 공유 링크(?p=)나 해시(#p=)에 담긴 이름·생년월일이 통계로 새지 않도록 잘라낸다.
export default function PrivateAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const url = new URL(event.url);
        url.search = "";
        url.hash = "";
        return { ...event, url: url.toString() };
      }}
    />
  );
}
