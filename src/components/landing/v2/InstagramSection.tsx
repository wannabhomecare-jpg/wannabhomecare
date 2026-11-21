import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { InstagramGlyph } from "@/components/icons/BrandLogos";
import { BUSINESS } from "@/lib/business";
import { INSTAGRAM_CONNECTED } from "@/lib/visibility";
import { IS_PREVIEW } from "@/lib/env";

/**
 * 인스타그램 — 계정 줄 + 최신 게시물 9칸. 연동(Phase 5) 전에는 자리표시이고,
 * 오픈 단계에서는 연동 전이면 블록을 숨긴다.
 */
export function InstagramSection() {
  if (!INSTAGRAM_CONNECTED && !IS_PREVIEW) return null;

  return (
    <section id="instagram" aria-labelledby="instagram-title" className="scroll-mt-24 border-b border-slate-200 bg-white py-12 md:py-16">
      <Container>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-brand-600 bg-white sm:size-14">
            <Image src="/logo/logo-mark.svg" alt="" width={34} height={26} unoptimized />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="instagram-title" className="truncate text-lg font-black text-brand-900 sm:text-xl">
              @{BUSINESS.instagramHandle}
            </h2>
            <p className="text-[13px] text-slate-600 sm:text-[15px]">인스타그램 최신 게시물 9개 · 자동 업데이트</p>
          </div>
          <a
            href={BUSINESS.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="인스타그램 팔로우 (새 창)"
            className="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 text-[15px] font-bold text-white transition hover:bg-brand-700 sm:px-6"
          >
            팔로우
          </a>
        </div>

        <ul className="mt-5 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-9">
          {Array.from({ length: 9 }).map((_, i) => (
            <li
              key={i}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl bg-brand-100 text-brand-800"
            >
              <InstagramGlyph aria-hidden className="size-6" />
              <span className="text-[13px] font-bold">게시물 {i + 1}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
