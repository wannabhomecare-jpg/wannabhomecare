"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 전화·카카오 버튼의 공통 동작.
 * - 값이 있으면 그 주소로 가는 링크
 * - 값이 없고 미리보기 단계면 버튼은 보이고, 누르면 "아직 연결 전입니다" 안내만 한다
 * - 값이 없고 오픈 단계면 아무것도 그리지 않는다
 */
export function ContactAction({
  href,
  external = false,
  preview,
  className,
  ariaLabel,
  children,
}: {
  href: string | null;
  external?: boolean;
  preview: boolean;
  className: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const [notice, setNotice] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (href) {
    return (
      <a
        href={href}
        className={className}
        aria-label={ariaLabel}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  if (!preview) return null;
  return (
    <span className="relative contents">
      <button
        type="button"
        className={className}
        aria-label={ariaLabel ? `${ariaLabel.replace(/\s*\(새 창\)$/, "")} (아직 연결 전입니다)` : undefined}
        onClick={() => {
          setNotice(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setNotice(false), 2500);
        }}
      >
        {children}
      </button>
      {notice && (
        <span
          role="status"
          className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-brand-950 px-5 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-lg md:bottom-10"
        >
          아직 연결 전입니다
        </span>
      )}
    </span>
  );
}
