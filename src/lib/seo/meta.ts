import type { Metadata } from "next";
import { IS_PREVIEW, publicEnv, siteConfig } from "@/lib/env";

export const SITE_TITLE = `${siteConfig.name} | 서울·경기·인천 원스톱 홈케어`;
export const SITE_DESCRIPTION =
  "청소 · 에어컨청소 · 컬비청소 · 줄눈 · 탄성코트 · 새집증후군. 서울·경기·인천에서 직영팀이 작업합니다. 30초 무료 견적 문의.";

/** 사이트 전역 메타. 미리보기 단계에서는 검색 수집을 막는다. */
export const baseMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: SITE_TITLE, template: `%s | ${siteConfig.name}` },
  description: SITE_DESCRIPTION,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: `${siteConfig.name} 로고` }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: IS_PREVIEW
    ? { index: false, follow: false, googleBot: { index: false, follow: false } }
    : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  verification: {
    google: publicEnv.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    other: publicEnv.NEXT_PUBLIC_NAVER_VERIFICATION
      ? { "naver-site-verification": publicEnv.NEXT_PUBLIC_NAVER_VERIFICATION }
      : undefined,
  },
};
