import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "챙김 · AI 준비물 체크리스트",
  description: "상황을 고르면 AI가 준비물 체크리스트를 만들어 주고, 하나씩 체크하며 빠짐없이 챙기게 도와줘요.",
};

export const viewport: Viewport = {
  themeColor: "#fbf6e9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full">
      <head>
        {/* 본문: Pretendard(CDN), 제목·숫자: Gaegu 손글씨(Google Fonts).
            App Router 의 루트 레이아웃이라 모든 페이지에 적용된다 (pages 라우터용 경고 규칙은 해당 없음). */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap" />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
