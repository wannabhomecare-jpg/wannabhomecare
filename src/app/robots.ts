import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { IS_PREVIEW, siteConfig } from "@/lib/env";

/** 미리보기 단계와 *.vercel.app 주소는 전체 차단. 오픈 단계의 실제 도메인만 연다. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") ?? "";
  if (IS_PREVIEW || host.endsWith(".vercel.app")) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/admin/"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
