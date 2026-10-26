import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents 는 끈다: 켜면 라우트의 `export const runtime = 'nodejs'` 를 쓸 수 없고,
  // 이 앱은 로그인 사용자별 데이터만 다루므로 캐시할 화면이 거의 없다.
  turbopack: {
    // 상위 폴더(홈 디렉터리)의 package-lock.json 을 루트로 착각하지 않도록 프로젝트 폴더로 고정
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
