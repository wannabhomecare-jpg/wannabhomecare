import { Container } from "@/components/ui/Container";
import type { CategoryContent } from "@/content/categories/types";
import { IS_PREVIEW } from "@/lib/env";
import type { ReviewCaptureData } from "@/types/database";
import { FaqAccordion } from "@/components/landing/v2/FaqAccordion";
import { CleanScope } from "./CleanScope";
import { CtaButtons } from "./CtaButtons";
import { DraftBadge } from "./DraftBadge";
import { ReviewCaptures } from "./ReviewCaptures";
import { SectionHead } from "./SectionHead";

/** 청소 범위(청소만) */
export function ScopeSection({ c }: { c: CategoryContent }) {
  if (!c.scope) return null;
  return (
    <section id="scope" aria-labelledby="scope-title" className="scroll-mt-24 bg-white py-14 md:py-24">
      <Container>
        <SectionHead id="scope-title" kicker="SCOPE" title={c.scope.title} badge={<DraftBadge draft={c.scope.draft} />} />
        <div className="mt-8 sm:mt-10">
          <CleanScope scope={c.scope} />
        </div>
        <p className="mt-6 text-[14px] leading-6 text-slate-600">{c.scope.footnote}</p>
      </Container>
    </section>
  );
}

/** 이 서비스의 공개 후기. 없으면 숨긴다 */
export function CategoryReviews({ reviews }: { reviews: ReviewCaptureData[] }) {
  if (reviews.length === 0) return null;
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-24 bg-brand-50 py-14 md:py-24">
      <Container>
        <SectionHead
          id="reviews-title"
          kicker="REVIEW"
          title={
            <>
              고객님이 <span className="text-brand-600">카카오톡으로</span> 보내 주신 후기
            </>
          }
          lead="받은 메시지를 캡처 그대로 보여 드립니다. 이름과 프로필은 가립니다."
        />
        <div className="mt-8 sm:mt-12" data-review-count={reviews.length}>
          <ReviewCaptures reviews={reviews} />
        </div>
      </Container>
    </section>
  );
}

/** 자주 묻는 질문 */
export function FaqSection({ c }: { c: CategoryContent }) {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 bg-white py-14 md:py-24">
      <Container className="max-w-4xl">
        <SectionHead id="faq-title" kicker="Q&A" title="자주 묻는 질문" />
        <div className="mt-8 sm:mt-10">
          <FaqAccordion preview={IS_PREVIEW} items={c.faq.map((f) => ({ question: f.q, answer: f.a, draft: f.draft }))} />
        </div>
      </Container>
    </section>
  );
}

/** 아래 견적 띠(남색) */
export function BottomCta({ c }: { c: CategoryContent }) {
  return (
    <section id="quote-cta" aria-labelledby="quote-cta-title" className="brand-grid scroll-mt-24 bg-brand-900 py-14 text-white md:py-20">
      <Container className="text-center">
        <h2 id="quote-cta-title" className="text-[1.6rem] font-black tracking-tight sm:text-4xl">
          {c.cta.title}
        </h2>
        <p className="mt-3 text-[15px] leading-7 text-brand-100 sm:text-lg">몇 가지만 고르면 접수됩니다. 내용을 확인한 뒤 상담사가 연락드립니다.</p>
        <div className="mx-auto mt-7 max-w-3xl">
          <CtaButtons service={c.cta.quoteService} tone="dark" />
        </div>
      </Container>
    </section>
  );
}
