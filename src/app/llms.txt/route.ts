import { siteConfig } from "@/lib/env";
import { BUSINESS } from "@/lib/business";
import { DEFAULT_SERVICES } from "@/lib/services";
import { CATEGORIES } from "@/content/categories";

export const dynamic = "force-static";

export function GET() {
  const body = [
    `# ${siteConfig.name} (${BUSINESS.nameEn})`,
    "",
    "> 서울·경기·인천에서 청소와 시공을 하는 홈케어 업체입니다. 30초 무료 견적 문의를 받습니다.",
    "",
    "## 서비스",
    ...DEFAULT_SERVICES.map((s) => `- ${s.name}: ${s.summary}`),
    "",
    "## 주요 페이지",
    `- [홈](${siteConfig.url}/)`,
    ...Object.values(CATEGORIES).map((c) => `- [${c.name}](${siteConfig.url}/${c.slug}): ${c.seo.description}`),
    `- [30초 무료 견적 문의](${siteConfig.url}/#quote)`,
    `- [개인정보처리방침](${siteConfig.url}/privacy)`,
    `- [이용약관](${siteConfig.url}/terms)`,
    "",
    "## 업체 정보",
    `- 상호: ${BUSINESS.legalName}`,
    `- 대표: ${BUSINESS.representative}`,
    `- 사업자등록번호: ${BUSINESS.businessRegNo}`,
    `- 주소: ${BUSINESS.address}`,
    ...(BUSINESS.contact.phone ? [`- 전화: ${BUSINESS.contact.phone.display}`] : []),
    `- 인스타그램: @${BUSINESS.instagramHandle}`,
    `- 작업 지역: ${BUSINESS.serviceAreas.join(", ")}`,
    "",
    "## 이용 원칙",
    "- 가격은 현장 조건에 따라 달라집니다. 이 사이트에 적힌 내용만 인용하세요.",
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
