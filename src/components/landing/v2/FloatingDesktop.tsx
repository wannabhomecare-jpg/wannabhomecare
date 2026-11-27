"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUp, Phone } from "@/components/icons";
import { KakaoBubble } from "@/components/icons/BrandLogos";
import { KAKAO_ARIA } from "@/lib/contact";
import { ContactAction } from "@/components/common/ContactAction";

/**
 * PC 우측 고정 — 빠른 이동(약속 · 서비스 · 고객후기 · 견적문의) + 바로연결 · 카톡상담 · TOP.
 * 첫 화면을 지나면 나타난다(기반 동작).
 */
export function FloatingDesktop({
  phone,
  kakaoUrl,
  preview,
  showReviews,
}: {
  phone: { tel: string; display: string } | null;
  kakaoUrl: string | null;
  preview: boolean;
  showReviews: boolean;
}) {
  const [showTop, setShowTop] = useState(false);
  const [showAside, setShowAside] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setShowTop(y > 600);
      setShowAside(y > 400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);

  const anchors = [
    { href: "/#promise", label: "약속" },
    { href: "/#services", label: "서비스" },
    ...(showReviews ? [{ href: "/#reviews", label: "고객후기" }] : []),
    { href: "/#quote", label: "견적문의" },
  ];

  return (
    <aside
      aria-label="빠른 이동"
      className={`fixed top-1/2 right-3 z-30 hidden -translate-y-1/2 flex-col items-stretch gap-2 transition-opacity duration-300 md:flex ${
        showAside ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <nav className="w-24 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200">
        <ul className="divide-y divide-slate-100">
          {anchors.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                tabIndex={showAside ? 0 : -1}
                className="block px-2 py-2.5 text-center text-[13px] font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              >
                {a.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ContactAction
        href={phone ? `tel:${phone.tel}` : null}
        preview={preview}
        className="flex w-24 flex-col items-center gap-1 rounded-2xl bg-brand-600 px-2 py-3 text-white shadow-lg hover:bg-brand-700"
      >
        <Phone aria-hidden className="size-6" strokeWidth={2.25} />
        <span className="text-xs font-extrabold">바로연결</span>
      </ContactAction>

      <ContactAction
        href={kakaoUrl}
        ariaLabel={KAKAO_ARIA}
        external
        preview={preview}
        className="flex w-24 flex-col items-center gap-1 rounded-2xl bg-kakao px-2 py-3 text-kakao-ink shadow-lg hover:brightness-95"
      >
        <KakaoBubble aria-hidden className="size-6" />
        <span className="text-xs font-extrabold">카톡상담</span>
      </ContactAction>

      <button
        type="button"
        onClick={toTop}
        aria-label="맨 위로"
        tabIndex={showTop ? 0 : -1}
        className={`flex w-24 flex-col items-center gap-1 rounded-2xl bg-brand-900 px-2 py-3 text-white shadow-lg transition-opacity hover:bg-brand-800 ${
          showTop ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ArrowUp aria-hidden className="size-6" strokeWidth={2.25} />
        <span className="text-xs font-extrabold">TOP</span>
      </button>
    </aside>
  );
}
