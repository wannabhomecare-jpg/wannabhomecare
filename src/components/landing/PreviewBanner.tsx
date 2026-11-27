import { IS_PREVIEW } from "@/lib/env";
import { BUSINESS } from "@/lib/business";
import { getHeroSlides, getServices } from "@/lib/site-content";
import { DRAFT_BANNER_LINE, previewBannerText } from "@/lib/preview-banner";
import { listDrafts } from "@/content/categories";

/** 미리보기 단계에서만 화면 맨 위에 보이는 얇은 띠. 아직 준비 중인 것만 적는다. */
export async function PreviewBanner() {
  if (!IS_PREVIEW) return null;
  const [slides, services] = await Promise.all([getHeroSlides(), getServices()]);
  const photosPending = slides.some((s) => !s.image) || services.some((s) => !s.image);
  const drafts = listDrafts().length > 0;
  return (
    <div className="flex min-h-[52px] flex-col items-center justify-center bg-brand-950 px-4 py-1.5 text-center text-[12px] leading-5 font-semibold text-brand-200 sm:min-h-8">
      <span>{previewBannerText({ kakao: Boolean(BUSINESS.contact.kakao), photosPending })}</span>
      {drafts && <span className="text-brand-300">{DRAFT_BANNER_LINE}</span>}
    </div>
  );
}
