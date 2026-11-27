import { siteConfig } from "@/lib/env";
import { BUSINESS } from "@/lib/business";

/** JSON-LD 를 <script> 안에 안전하게 넣는다(</script> 끊김 방지). */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: `${siteConfig.url}/`,
  };
}

/**
 * 업체 정보. 확인된 값만 넣는다(영업시간·가격대·평점은 넣지 않는다).
 */
export function localBusinessJsonLd() {
  const phone = BUSINESS.contact.phone;
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${siteConfig.url}/#business`,
    name: BUSINESS.legalName,
    alternateName: BUSINESS.nameEn,
    url: `${siteConfig.url}/`,
    image: `${siteConfig.url}/og-image.png`,
    logo: `${siteConfig.url}/favicon-192.png`,
    ...(phone ? { telephone: phone.display } : {}),
    address: {
      "@type": "PostalAddress",
      addressCountry: "KR",
      addressRegion: "서울특별시",
      addressLocality: "중구",
    },
    areaServed: BUSINESS.serviceAreas.map((name) => ({ "@type": "AdministrativeArea", name })),
    sameAs: [BUSINESS.instagramUrl, ...(BUSINESS.contact.kakao ? [BUSINESS.contact.kakao.home] : [])],
  };
}
