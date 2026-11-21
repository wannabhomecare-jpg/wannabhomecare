import { IS_PREVIEW } from "@/lib/env";
import { getReviewCaptures } from "@/lib/site-content";
import type { ReviewCaptureData } from "@/types/database";

/**
 * 후기·인스타그램 블록을 보일지 정한다.
 * - 후기: 공개된 캡처가 있거나 미리보기 단계(자리표시)면 보인다. 오픈 단계에서 0건이면 숨긴다.
 * - 인스타그램: 연동(Phase 5) 전에는 미리보기에서만 자리표시로 보인다.
 */
export const INSTAGRAM_CONNECTED = false;

export async function getPublishedReviews(): Promise<ReviewCaptureData[]> {
  const all = await getReviewCaptures();
  return all.filter((r) => r.published && r.image);
}

export async function getSectionVisibility() {
  const reviews = await getPublishedReviews();
  return {
    reviews: reviews.length > 0 || IS_PREVIEW,
    instagram: INSTAGRAM_CONNECTED || IS_PREVIEW,
  };
}
