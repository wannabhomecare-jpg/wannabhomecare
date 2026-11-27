import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { MobileBottomBar } from "@/components/landing/v2/MobileBottomBar";
import { FloatingDesktop } from "@/components/landing/v2/FloatingDesktop";
import { CategoryHero } from "@/components/category/CategoryHero";
import { CtaStrip } from "@/components/category/CtaStrip";
import { WhyCards } from "@/components/category/WhyCards";
import { Principles } from "@/components/category/Principles";
import { ProcessSteps } from "@/components/category/ProcessSteps";
import { SpecialBlocks } from "@/components/category/SpecialBlocks";
import { BeforeAfterSection } from "@/components/category/BeforeAfterSection";
import { BottomCta, CategoryReviews, FaqSection, ScopeSection } from "@/components/category/CategoryLower";
import { getCategory } from "@/content/categories";
import { SERVICE_KEYS } from "@/lib/services";
import { getBeforeAfter, getServices } from "@/lib/site-content";
import { getPublishedReviews } from "@/lib/visibility";
import { publishedBeforeAfter } from "@/lib/media-items";
import { BUSINESS } from "@/lib/business";
import { IS_PREVIEW } from "@/lib/env";
import { baseMetadata } from "@/lib/seo/meta";
import { categoryJsonLd, safeJsonLd } from "@/lib/seo/jsonld";

// 관리자에서 바꾼 전·후 사진·후기를 1분 안에 반영
export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICE_KEYS.map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) return {};
  return {
    title: { absolute: c.seo.title },
    description: c.seo.description,
    alternates: { canonical: `/${c.slug}` },
    openGraph: { ...baseMetadata.openGraph, title: c.seo.title, description: c.seo.description, url: `/${c.slug}` },
    twitter: { ...baseMetadata.twitter, title: c.seo.title, description: c.seo.description },
  };
}

/**
 * 카테고리 화면: 헤더 → 히어로 → 견적 띠 → 왜·무엇이 다른가 → 원칙 → 작업 프로세스 → 전용 블록
 * → 전·후 사진 → 청소 범위(청소만) → 후기 → 자주 묻는 질문 → 아래 견적 띠 → 푸터
 */
export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const c = getCategory(slug);
  if (!c) notFound();

  const [services, allBa, reviews] = await Promise.all([getServices(), getBeforeAfter(), getPublishedReviews(c.slug)]);
  const ba = publishedBeforeAfter(allBa, c.slug);
  const phone = BUSINESS.contact.phone;
  const showBa = ba.length > 0 || IS_PREVIEW;
  const anchors = [
    { href: "#principles", label: "원칙" },
    ...(c.process ? [{ href: "#process", label: "과정" }] : []),
    ...(showBa ? [{ href: "#before-after", label: "전후" }] : []),
    { href: "#faq", label: "질문" },
    { href: "#quote-cta", label: "견적문의" },
  ];

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: safeJsonLd(categoryJsonLd(c)) }} />
      <Header current={c.slug} />
      <main className="flex-1" data-category={c.slug}>
        <CategoryHero c={c} services={services} />
        <CtaStrip c={c} />
        <WhyCards c={c} />
        <Principles c={c} />
        <ProcessSteps c={c} />
        <SpecialBlocks c={c} />
        <BeforeAfterSection c={c} items={ba} />
        <ScopeSection c={c} />
        <CategoryReviews reviews={reviews} />
        <FaqSection c={c} />
        <BottomCta c={c} />
      </main>
      <Footer />
      <MobileBottomBar service={c.cta.quoteService} />
      <FloatingDesktop
        phone={phone ? { tel: phone.tel, display: phone.display } : null}
        kakaoUrl={BUSINESS.contact.kakao?.url ?? null}
        preview={IS_PREVIEW}
        showReviews={reviews.length > 0}
        anchors={anchors}
      />
    </>
  );
}
