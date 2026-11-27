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

/** 카테고리 화면: 빵부스러기 + 서비스. 가격·평점은 넣지 않는다 */
export function categoryJsonLd(c: { slug: string; name: string; seo: { description: string } }) {
  const url = `${siteConfig.url}/${c.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: BUSINESS.legalName, item: `${siteConfig.url}/` },
        { "@type": "ListItem", position: 2, name: c.name, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: c.name,
      serviceType: c.name,
      description: c.seo.description,
      url,
      provider: { "@type": "HomeAndConstructionBusiness", "@id": `${siteConfig.url}/#business`, name: BUSINESS.legalName },
      areaServed: BUSINESS.serviceAreas.map((name) => ({ "@type": "AdministrativeArea", name })),
    },
  ];
}
