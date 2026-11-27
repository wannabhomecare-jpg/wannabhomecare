import { FileText, Phone } from "@/components/icons";
import { KakaoBubble } from "@/components/icons/BrandLogos";
import { KAKAO_ARIA } from "@/lib/contact";
import { ContactAction } from "@/components/common/ContactAction";
import { QuoteLink } from "@/components/common/QuoteLink";
import { BUSINESS } from "@/lib/business";
import { IS_PREVIEW } from "@/lib/env";

/**
 * 휴대폰 하단 고정 버튼 3개(고객 요청): 견적문의 · 바로연결 · 카톡상담.
 * 본문 아래에는 이 높이만큼 여백을 둔다(푸터 pb).
 */
export function MobileBottomBar() {
  const phone = BUSINESS.contact.phone;
  const kakao = BUSINESS.contact.kakao;
  const btn = "flex h-14 items-center justify-center gap-1.5 rounded-2xl text-[17px] font-extrabold shadow-md";
  return (
    <div
      role="region"
      aria-label="빠른 상담"
      className="fixed bottom-0 left-0 z-40 w-full border-t border-slate-200 bg-white/95 px-3 pt-2.5 backdrop-blur md:hidden"
      style={{ paddingBottom: "max(0.625rem, env(safe-area-inset-bottom))" }}
    >
      <div className="grid grid-cols-3 gap-2">
        <QuoteLink className={`${btn} bg-brand-900 text-white`}>
          <FileText aria-hidden className="size-5" strokeWidth={2.25} />
          견적문의
        </QuoteLink>
        <ContactAction
          href={phone ? `tel:${phone.tel}` : null}
          preview={IS_PREVIEW}
          className={`${btn} w-full bg-brand-600 text-white`}
        >
          <Phone aria-hidden className="size-5" strokeWidth={2.25} />
          바로연결
        </ContactAction>
        <ContactAction href={kakao?.url ?? null} ariaLabel={KAKAO_ARIA} external preview={IS_PREVIEW} className={`${btn} w-full bg-kakao text-kakao-ink`}>
          <KakaoBubble aria-hidden className="size-5" />
          카톡상담
        </ContactAction>
      </div>
    </div>
  );
}
