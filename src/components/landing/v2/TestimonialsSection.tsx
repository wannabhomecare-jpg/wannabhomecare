import { Container } from "@/components/ui/Container";
import { MessageCircle } from "@/components/icons";
import { Reveal } from "@/components/ui/Reveal";
import { TestimonialsCarouselClient } from "./TestimonialsCarouselClient";
import { ReviewCaptures } from "@/components/category/ReviewCaptures";
import { IS_PREVIEW } from "@/lib/env";
import { getPublishedReviews } from "@/lib/visibility";

/**
 * 고객 후기 — 고객이 보낸 카카오톡 캡처(이름·프로필을 가린 것)만 보여 준다.
 * 미리보기에서 캡처가 없으면 자리표시 4칸, 오픈 단계에서 0건이면 블록을 숨긴다.
 */
export async function TestimonialsSection() {
  const reviews = await getPublishedReviews();
  if (reviews.length === 0 && !IS_PREVIEW) return null;

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-24 bg-brand-50 py-14 md:py-24">
      <Container>
        <Reveal variant="up" className="max-w-2xl sm:mx-auto sm:text-center">
          <p className="section-kicker">REVIEW</p>
          <h2 id="reviews-title" className="mt-3 text-[1.6rem] font-black tracking-tight text-brand-900 sm:mt-4 sm:text-4xl lg:text-[2.75rem]">
            고객님이 <span className="text-brand-600">카카오톡으로</span> 보내 주신 후기
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-600 sm:mt-4 sm:text-lg">
            받은 메시지를 캡처 그대로 보여 드립니다. 이름과 프로필은 가립니다.
          </p>
        </Reveal>

        <Reveal variant="fade" delay={0.1} className="mt-7 sm:mt-12">
          {reviews.length > 0 ? (
            <ReviewCaptures reviews={reviews} />
          ) : (
            <TestimonialsCarouselClient label="고객 후기">
              {[1, 2, 3, 4].map((n) => (
                <article key={n} className="overflow-hidden rounded-2xl border border-brand-200 bg-white">
                  <div className="flex aspect-[3/2] flex-col items-center justify-center gap-2 bg-brand-100 px-3 text-center">
                    <MessageCircle aria-hidden className="size-8 text-brand-600" strokeWidth={1.75} />
                    <p className="text-[15px] font-bold text-brand-800">카카오톡 후기 캡처 자리</p>
                  </div>
                  <div className="px-4 py-3 sm:px-5 sm:py-4">
                    <p className="text-[15px] font-bold text-brand-900">[서비스 · 지역]</p>
                  </div>
                </article>
              ))}
            </TestimonialsCarouselClient>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
