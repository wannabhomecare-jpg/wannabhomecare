import type { Metadata } from "next";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { HeroV2 } from "@/components/landing/v2/HeroV2";
import { MasterSection } from "@/components/landing/v2/MasterSection";
import { ServicesList } from "@/components/landing/v2/ServicesList";
import { TestimonialsSection } from "@/components/landing/v2/TestimonialsSection";
import { InstagramSection } from "@/components/landing/v2/InstagramSection";
import { QuoteFormSectionV2 } from "@/components/landing/v2/QuoteFormSectionV2";
import { MobileBottomBar } from "@/components/landing/v2/MobileBottomBar";
import { FloatingDesktop } from "@/components/landing/v2/FloatingDesktop";
import { baseMetadata } from "@/lib/seo/meta";
import { localBusinessJsonLd, safeJsonLd } from "@/lib/seo/jsonld";
import { BUSINESS } from "@/lib/business";
import { IS_PREVIEW } from "@/lib/env";
import { getSectionVisibility } from "@/lib/visibility";

export const revalidate = 60;
export const metadata: Metadata = baseMetadata;

/**
 * 메인: 상단 띠 → 헤더 → 한 줄 띠 → 첫 화면(히어로 + 실시간 목록) → 약속 → 서비스 6칸
 * → 고객 후기 → 인스타그램 → 30초 무료 견적 → 푸터
 */
export default async function HomePage() {
  const vis = await getSectionVisibility();
  const phone = BUSINESS.contact.phone;
  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeJsonLd(localBusinessJsonLd()) }}
      />
      <Header />
      <main className="flex-1">
        <HeroV2 />
        <MasterSection />
        <ServicesList />
        <TestimonialsSection />
        <InstagramSection />
        <QuoteFormSectionV2 />
      </main>
      <Footer />
      <MobileBottomBar />
      <FloatingDesktop
        phone={phone ? { tel: phone.tel, display: phone.display } : null}
        kakaoUrl={BUSINESS.contact.kakao?.url ?? null}
        preview={IS_PREVIEW}
        showReviews={vis.reviews}
      />
    </>
  );
}
