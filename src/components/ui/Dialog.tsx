"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "@/components/icons";

/**
 * 네이티브 <dialog> 창. showModal 로 열어 바깥을 비활성(포커스가 창 안에 머문다)으로 만든다.
 * Esc·닫기 버튼·바깥 누르기로 닫고, 닫으면 연 버튼으로 포커스를 돌려준다.
 */
export function Dialog({
  open,
  onClose,
  label,
  className = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      d.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onDialogClose = () => {
      document.body.style.overflow = "";
      opener.current?.focus?.();
      onClose();
    };
    d.addEventListener("close", onDialogClose);
    return () => d.removeEventListener("close", onDialogClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      className={`m-auto max-h-[92vh] w-[min(92vw,720px)] overflow-visible bg-transparent p-0 backdrop:bg-brand-950/80 backdrop:backdrop-blur-sm ${className}`}
    >
      {open && (
        <div className="relative">
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="닫기"
            className="absolute -top-12 right-0 inline-flex size-10 items-center justify-center rounded-full bg-white text-brand-900 shadow-lg hover:bg-brand-50"
          >
            <X aria-hidden className="size-5" strokeWidth={2.5} />
          </button>
          {children}
        </div>
      )}
    </dialog>
  );
}
