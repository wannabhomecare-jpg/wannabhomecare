import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { Phone } from "@/components/icons";
import { ContactAction } from "@/components/common/ContactAction";
import { BUSINESS } from "@/lib/business";
import { IS_PREVIEW } from "@/lib/env";
import { getServices } from "@/lib/site-content";
import { MobileMenu } from "./MobileMenu";

/**
 * 사이트 헤더 — 상단 띠(PC) + 메인 헤더.
 * 띠: [무료 견적] 365일 상담 가능 · 대표번호
 * 메인: [가로 로고 | 한 줄]   [메뉴 6개] [전화]
 * 카테고리 화면은 Phase 2 에서 만든다. 지금은 메뉴가 모두 서비스 6칸(/#services)으로 간다.
 */
export async function Header() {
  const services = await getServices();
  const phone = BUSINESS.contact.phone;
  const tel = phone ? `tel:${phone.tel}` : null;

  return (
    <header className="sticky top-0 z-40 bg-brand-900 text-white shadow-[0_8px_30px_rgb(0_0_0/0.12)]">
      <div className="hidden bg-brand-700 md:block">
        <Container className="flex h-9 items-center justify-center gap-3 text-[13px] font-bold">
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-extrabold text-brand-700">무료 견적</span>
          <span className="text-white">365일 상담 가능</span>
          {phone && (
            <>
              <span aria-hidden className="text-brand-300">
                ·
              </span>
              <a href={`tel:${phone.tel}`} className="font-extrabold text-white hover:underline">
                {phone.display}
              </a>
            </>
          )}
        </Container>
      </div>

      <Container className="flex h-14 items-center justify-between gap-3 md:h-[68px]">
        <div className="flex min-w-0 items-center gap-4">
          <Logo variant="horizontal-white" height={34} priority imgClassName="h-[30px] w-auto md:h-[34px]" />
          <span className="hidden border-l border-white/25 pl-4 text-[13px] font-semibold text-brand-200 xl:inline-block">
            {BUSINESS.tagline}
          </span>
        </div>

        <nav aria-label="주요 메뉴" className="flex items-center gap-1">
          <ul className="hidden items-center lg:flex">
            {services.map((s) => (
              <li key={s.key}>
                <Link
                  href="/#services"
                  className="rounded-lg px-3 py-2 text-[15px] font-bold whitespace-nowrap text-white transition hover:bg-white/10 xl:px-4"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
          <MobileMenu items={services.map((s) => ({ key: s.key, name: s.name }))} />
          <ContactAction
            href={tel}
            preview={IS_PREVIEW}
            ariaLabel={phone ? `전화 ${phone.display}로 상담` : "전화 상담"}
            className="ml-1 inline-flex size-10 items-center justify-center rounded-full bg-white text-brand-700 shadow-lg transition hover:bg-brand-50 md:ml-3 md:size-11"
          >
            <Phone aria-hidden className="size-5" strokeWidth={2.25} />
          </ContactAction>
        </nav>
      </Container>
    </header>
  );
}
