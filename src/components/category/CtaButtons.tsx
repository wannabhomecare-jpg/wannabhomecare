import { ArrowRight, Phone } from "@/components/icons";
import { KakaoBubble } from "@/components/icons/BrandLogos";
import { ContactAction } from "@/components/common/ContactAction";
import { QuoteLink } from "@/components/common/QuoteLink";
import { BUSINESS } from "@/lib/business";
import { IS_PREVIEW } from "@/lib/env";
import { kakaoAria } from "@/lib/contact";
import type { ServiceKey } from "@/lib/services";

/** 견적 · 바로연결 · 카톡상담 버튼 묶음 (위 띠: light, 아래 띠: dark) */
export function CtaButtons({ service, tone }: { service: ServiceKey; tone: "light" | "dark" }) {
  const phone = BUSINESS.contact.phone;
  const kakao = BUSINESS.contact.kakao;
  const base = "flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-extrabold transition sm:h-14 sm:text-base";
  const phoneLabel = tone === "dark" && phone ? phone.display : "바로연결";
  const kakaoLabel = tone === "dark" ? "카카오톡 상담" : "카톡상담";
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-3">
      <QuoteLink
        service={service}
        className={`${base} col-span-2 ${tone === "dark" ? "bg-white text-brand-900 hover:bg-brand-50" : "bg-brand-900 text-white hover:bg-brand-800"}`}
      >
        30초 무료 견적 문의
        <ArrowRight aria-hidden className="size-5" strokeWidth={2.5} />
      </QuoteLink>
      <ContactAction
        href={phone ? `tel:${phone.tel}` : null}
        preview={IS_PREVIEW}
        ariaLabel={phone ? `${phoneLabel} · 전화 ${phone.display}` : undefined}
        className={`${base} w-full bg-brand-600 text-white hover:bg-brand-700 sm:w-auto`}
      >
        <Phone aria-hidden className="size-5" strokeWidth={2.25} />
        {phoneLabel}
      </ContactAction>
      <ContactAction
        href={kakao?.url ?? null}
        external
        preview={IS_PREVIEW}
        ariaLabel={kakaoAria(kakaoLabel)}
        className={`${base} w-full bg-kakao text-kakao-ink hover:brightness-95 sm:w-auto`}
      >
        <KakaoBubble aria-hidden className="size-5" />
        {kakaoLabel}
      </ContactAction>
    </div>
  );
}
