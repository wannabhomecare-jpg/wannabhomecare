import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { MapPin } from "@/components/icons";
import { BUSINESS } from "@/lib/business";
import { getSectionVisibility } from "@/lib/visibility";

/** 푸터 — 세로 로고, 링크, 작업 지역, 사업자 정보, 저작권, AI 이미지 안내 */
export async function Footer() {
  const vis = await getSectionVisibility();
  const phone = BUSINESS.contact.phone;
  const menu = [
    { href: "/#services", label: "서비스 안내" },
    ...(vis.reviews ? [{ href: "/#reviews", label: "고객 후기" }] : []),
    { href: "/#quote", label: "견적 문의" },
    { href: "/privacy", label: "개인정보처리방침" },
    { href: "/terms", label: "이용약관" },
  ];

  return (
    <footer className="bg-brand-950 pb-28 text-brand-100 md:pb-0">
      <Container className="py-12 text-center sm:py-16">
        <div className="flex justify-center">
          <Logo variant="vertical-white" height={96} />
        </div>

        <nav aria-label="푸터 메뉴" className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[15px] font-bold text-white">
          {menu.map((m) => (
            <Link key={m.href} href={m.href} className="hover:underline">
              {m.label}
            </Link>
          ))}
        </nav>

        <div className="mt-9 flex flex-col items-center gap-3">
          <p className="text-xs font-extrabold tracking-[0.18em] text-brand-300">SERVICE AREA</p>
          <ul className="flex flex-wrap items-center justify-center gap-2">
            {BUSINESS.serviceAreas.map((r) => (
              <li
                key={r}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold text-white ring-1 ring-brand-200/30 ring-inset sm:text-sm"
              >
                <MapPin aria-hidden className="size-4 text-brand-300" strokeWidth={2.25} />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-9 space-y-1.5 text-[13px] leading-6 text-brand-100 sm:text-sm">
          <p className="flex flex-wrap justify-center gap-x-2">
            <span>상호 {BUSINESS.legalName}</span>
            <span aria-hidden className="text-brand-300/50">│</span>
            <span>대표 {BUSINESS.representative}</span>
            <span aria-hidden className="text-brand-300/50">│</span>
            <span>사업자등록번호 {BUSINESS.businessRegNo}</span>
          </p>
          <p className="flex flex-wrap justify-center gap-x-2">
            <span>주소 {BUSINESS.address}</span>
            {phone && (
              <>
                <span aria-hidden className="text-brand-300/50">│</span>
                <span>
                  전화{" "}
                  <a href={`tel:${phone.tel}`} className="hover:underline">
                    {phone.display}
                  </a>
                </span>
              </>
            )}
            <span aria-hidden className="text-brand-300/50">│</span>
            <span>
              인스타그램{" "}
              <a href={BUSINESS.instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                @{BUSINESS.instagramHandle}
              </a>
            </span>
          </p>
        </div>

        <p className="mt-6 text-xs text-brand-200">COPYRIGHT © {BUSINESS.legalName}. ALL RIGHTS RESERVED.</p>
        <p className="mt-3 text-xs text-brand-200">일부 이미지는 AI로 제작한 연출 이미지입니다.</p>
      </Container>
    </footer>
  );
}
