"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ChevronRight, FileText } from "@/components/icons";
import { QuoteLink } from "@/components/common/QuoteLink";

type Item = { key: string; name: string; href: string };

/** 휴대폰 메뉴(서랍). 메뉴 6개와 '견적 문의'. ESC 로 닫힌다. */
export function MobileMenu({ items, current }: { items: Item[]; current?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="메뉴 열기"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-lg text-white hover:bg-white/10 lg:hidden"
      >
        <Menu aria-hidden className="size-6" strokeWidth={2.25} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="메뉴">
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-brand-950/60 backdrop-blur-sm" aria-hidden />
          <aside className="absolute top-0 left-0 flex h-full w-[86%] max-w-sm animate-[slideInLeft_.25s_ease-out] flex-col bg-brand-900 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="text-base font-black">메뉴</span>
              <button
                type="button"
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-lg text-brand-100 hover:bg-white/10"
              >
                <X aria-hidden className="size-5" strokeWidth={2.25} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="휴대폰 메뉴">
              <ul className="flex flex-col">
                {items.map((it) => (
                  <li key={it.key}>
                    <Link
                      href={it.href}
                      onClick={() => setOpen(false)}
                      aria-current={current === it.key ? "page" : undefined}
                      className={`flex items-center justify-between rounded-xl px-3 py-3.5 text-base font-bold ${current === it.key ? "bg-white text-brand-900" : "text-white hover:bg-white/10"}`}
                    >
                      <span>{it.name}</span>
                      <ChevronRight aria-hidden className="size-5 text-brand-300" strokeWidth={2} />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-white/10 p-4">
              <QuoteLink
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-base font-extrabold text-brand-700"
              >
                <FileText aria-hidden className="size-5" strokeWidth={2.25} />
                <span>견적 문의</span>
              </QuoteLink>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
