import { IS_PREVIEW } from "@/lib/env";
import { BUSINESS } from "@/lib/business";
import { getHeroSlides, getServices } from "@/lib/site-content";
import { previewBannerText } from "@/lib/preview-banner";

/** 미리보기 단계에서만 화면 맨 위에 보이는 얇은 띠. 아직 준비 중인 것만 적는다. */
export async function PreviewBanner() {
  if (!IS_PREVIEW) return null;
  const [slides, services] = await Promise.all([getHeroSlides(), getServices()]);
  const photosPending = slides.some((s) => !s.image) || services.some((s) => !s.image);
  return (
    <div className="bg-brand-950 text-brand-200 flex min-h-[52px] items-center justify-center px-4 py-1.5 text-center text-[12px] leading-5 font-semibold sm:min-h-8">
      {previewBannerText({ kakao: Boolean(BUSINESS.contact.kakao), photosPending })}
    </div>
  );
}
