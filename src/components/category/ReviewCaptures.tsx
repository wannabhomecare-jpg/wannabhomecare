"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { TestimonialsCarouselClient } from "@/components/landing/v2/TestimonialsCarouselClient";
import type { ReviewCaptureData } from "@/types/database";

export const reviewAlt = (label: string) =>
  `카카오톡으로 받은 고객 후기 캡처(이름과 프로필 사진은 가림)${label ? ` — ${label}` : ""}`;

/**
 * 후기 캡처 카드(메인·카테고리 공통). 가로로 긴 카카오톡 말풍선을 자르지 않고 원래 비율 그대로 둔다.
 * 누르면 크게 본다(최대 720px).
 */
export function ReviewCaptures({ reviews, label = "고객 후기" }: { reviews: ReviewCaptureData[]; label?: string }) {
  const [open, setOpen] = useState<ReviewCaptureData | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <>
      <TestimonialsCarouselClient label={label} itemClassName="w-[88vw] max-w-[440px] sm:w-[440px]">
        {reviews.map((r) => (
          <figure key={r.id} className="flex h-full flex-col overflow-hidden rounded-2xl bg-brand-950 ring-1 ring-brand-900">
            <button
              type="button"
              onClick={() => setOpen(r)}
              aria-label={`후기 크게 보기${r.label ? ` — ${r.label}` : ""}`}
              className="flex h-[190px] items-center justify-center p-3 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white sm:h-[230px] sm:p-4"
            >
              <Image
                src={r.image.url}
                alt={reviewAlt(r.label)}
                width={r.image.width}
                height={r.image.height}
                sizes="(min-width: 640px) 410px, 82vw"
                className="h-auto max-h-full w-auto max-w-full rounded-lg"
              />
            </button>
            {r.label && (
              <figcaption className="border-t border-white/10 px-4 py-3 text-[15px] font-bold text-white">{r.label}</figcaption>
            )}
          </figure>
        ))}
      </TestimonialsCarouselClient>

      <Dialog open={!!open} onClose={close} label="후기 크게 보기">
        {open && (
          <figure className="rounded-2xl bg-brand-950 p-3 sm:p-4">
            <Image
              src={open.image.url}
              alt={reviewAlt(open.label)}
              width={open.image.width}
              height={open.image.height}
              sizes="(min-width: 760px) 690px, 88vw"
              className="h-auto max-h-[80vh] w-full rounded-lg object-contain"
            />
            {open.label && <figcaption className="mt-3 text-[15px] font-bold text-white">{open.label}</figcaption>}
          </figure>
        )}
      </Dialog>
    </>
  );
}
