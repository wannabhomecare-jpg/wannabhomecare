import { HeroCarouselClient } from "./HeroCarouselClient";
import { LiveStatusTableClient } from "./LiveStatusTableClient";
import { QuoteStartCard } from "./QuoteStartCard";
import { Phone } from "@/components/icons";
import { KakaoBubble } from "@/components/icons/BrandLogos";
import { kakaoAria } from "@/lib/contact";
import { ContactAction } from "@/components/common/ContactAction";
import { BUSINESS } from "@/lib/business";
import { IS_PREVIEW, SITE_STAGE } from "@/lib/env";
import { getRecentBoardItems } from "@/lib/board";
import { planBoard } from "@/lib/live-board";
import { getHeroSlides, getLiveBoardSettings, getServices } from "@/lib/site-content";

/**
 * 첫 화면: 한 줄 띠 → [히어로 6장 | 실시간 접수 목록 + 전화 카드 + 카카오 버튼]
 */
export async function HeroV2() {
  const [slides, settings, real, services] = await Promise.all([
    getHeroSlides(),
    getLiveBoardSettings(),
    getRecentBoardItems(40),
    getServices(),
  ]);
  const plan = planBoard({ stage: SITE_STAGE, enabled: settings.enabled, real, now: new Date() });
  const phone = BUSINESS.contact.phone;
  const kakao = BUSINESS.contact.kakao;

  return (
    <section aria-label="첫 화면" className="brand-grid relative isolate overflow-hidden bg-brand-900">
      <div className="bg-brand-600 px-4 py-2 text-center text-[13px] font-bold text-white sm:text-[15px]">
        <span>100% 직영팀 · 배상책임보험 가입</span>
        <span aria-hidden className="mx-2 text-brand-200 sm:mx-3">
          │
        </span>
        <span className="hidden md:inline">{services.map((s) => s.name).join(" · ")}</span>
        <span className="md:hidden">수도권 원스톱 홈케어</span>
      </div>

      <div className="mx-auto grid max-w-(--container-content) grid-cols-1 items-stretch lg:min-h-[540px] lg:grid-cols-[2fr_1fr]">
        <div className="relative h-[86vw] max-h-[460px] min-h-[300px] overflow-hidden sm:h-[56vw] lg:h-auto lg:max-h-none">
          <HeroCarouselClient slides={slides} />
        </div>

        <aside aria-label="견적 접수 현황" className="flex flex-col overflow-hidden bg-white lg:min-h-0">
          <div className="min-h-0 flex-1 overflow-hidden">
            {plan.mode === "list" ? (
              <LiveStatusTableClient initial={plan.rows} demo={plan.demo} live={plan.live} rows={8} />
            ) : (
              <QuoteStartCard services={services.filter((s) => s.inQuoteFirst)} />
            )}
          </div>

          <div className="shrink-0 space-y-2.5 bg-brand-900 px-4 py-4 sm:px-5">
            <ContactAction
              href={phone ? `tel:${phone.tel}` : null}
              preview={IS_PREVIEW}
              className="block w-full rounded-xl border border-white/25 bg-white/5 px-3 py-2.5 text-center transition hover:bg-white/10"
            >
              <span className="block text-xs font-bold tracking-wider text-brand-200">전화 상담</span>
              <span className="mt-0.5 inline-flex items-center gap-2 text-2xl font-black tracking-tight text-white">
                <Phone aria-hidden className="size-5" strokeWidth={2.5} />
                {phone ? phone.display : "전화번호 준비 중"}
              </span>
            </ContactAction>
            <ContactAction
              href={kakao?.url ?? null}
              ariaLabel={kakaoAria("카카오톡으로 빠른 상담")}
              external
              preview={IS_PREVIEW}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-kakao text-base font-extrabold text-kakao-ink shadow-md transition hover:brightness-95"
            >
              <KakaoBubble aria-hidden className="size-5" />
              <span>카카오톡으로 빠른 상담</span>
            </ContactAction>
          </div>
        </aside>
      </div>
    </section>
  );
}
