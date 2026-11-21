import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 견적 사진은 브라우저에서 줄여 합계 4MB 이하로 보낸다(Vercel 함수 본문 한도 4.5MB).
      bodySizeLimit: "4.4mb",
    },
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    formats: ["image/avif", "image/webp"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async headers() {
    return [
      {
        // *.vercel.app 주소는 단계와 상관없이 항상 검색 수집을 막는다.
        source: "/:path*",
        has: [{ type: "host", value: "(?<host>.*\\.vercel\\.app)" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
