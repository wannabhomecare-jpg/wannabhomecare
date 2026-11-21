"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export const QUOTE_PRESET_KEY = "wb-quote-preset";
export const QUOTE_PRESET_EVENT = "wb:quote-preset";

/**
 * /#quote 로 가는 링크. service 를 주면 견적이 그 서비스가 선택된 상태로 시작한다
 * (컬비청소는 청소 + '함께 알아보는 견적'에 컬비청소가 미리 선택된다).
 */
export function QuoteLink({
  service,
  className,
  children,
  ariaLabel,
  onClick,
}: {
  service?: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/#quote"
      className={className}
      aria-label={ariaLabel}
      onClick={() => {
        if (service) {
          try {
            sessionStorage.setItem(QUOTE_PRESET_KEY, service);
          } catch {
            // 저장소를 못 쓰면 이벤트만 보낸다
          }
          window.dispatchEvent(new CustomEvent(QUOTE_PRESET_EVENT, { detail: service }));
        }
        onClick?.();
      }}
    >
      {children}
    </Link>
  );
}
