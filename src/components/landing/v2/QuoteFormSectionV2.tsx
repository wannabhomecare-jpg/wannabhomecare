import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { QuoteWizard } from "../QuoteWizard";
import { BUSINESS } from "@/lib/business";
import { IS_PREVIEW } from "@/lib/env";
import { getServices } from "@/lib/site-content";
import type { QuoteService } from "@/lib/quote";

/** 30초 무료 견적 문의(FREE QUOTE) — 한 화면에 질문 하나씩 */
export async function QuoteFormSectionV2() {
  const services = await getServices();
  const hints: Partial<Record<QuoteService, string>> = {};
  for (const s of services) if (s.inQuoteFirst) hints[s.key as QuoteService] = s.quoteHint;
  const phone = BUSINESS.contact.phone;

  return (
    <section
      id="quote"
      aria-labelledby="quote-title"
      className="brand-grid scroll-mt-20 bg-brand-900 py-14 text-white md:py-24"
    >
      <Container>
        <Reveal variant="up" className="max-w-3xl sm:mx-auto sm:text-center">
          <p className="section-kicker section-kicker-dark">FREE QUOTE</p>
          <h2 id="quote-title" className="mt-3 text-[1.6rem] font-black tracking-tight text-white sm:mt-4 sm:text-4xl lg:text-[2.75rem]">
            30초 무료 견적 문의
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-brand-100 sm:mt-4 sm:text-lg">
            몇 가지만 고르면 접수됩니다. 내용을 확인한 뒤 상담사가 연락드립니다.
          </p>
        </Reveal>

        <div className="mt-7 sm:mt-12">
          <QuoteWizard
            hints={hints}
            phone={phone ? { tel: phone.tel, display: phone.display } : null}
            kakaoUrl={BUSINESS.contact.kakao?.url ?? null}
            preview={IS_PREVIEW}
          />
        </div>
      </Container>
    </section>
  );
}
