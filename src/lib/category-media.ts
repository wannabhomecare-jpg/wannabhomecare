/**
 * 카테고리 히어로에 무엇을 보여 줄지 정한다(순수 함수 — 테스트용).
 * - hero.backgroundVideo 가 있으면 소리 없는 반복 영상(움직임 줄이기 설정이면 포스터만)
 * - image.src 가 '@service:<key>' 면 그 서비스 카드 사진. 값이 없으면 남색 바탕만
 * - 그 밖에는 image.src 그대로
 */
import type { CategoryContent } from "@/content/categories/types";
import type { ServiceItem } from "@/lib/services";

export type HeroMedia =
  | { type: "video"; src: string; poster: string; kind: "real" | "ai" }
  | { type: "image"; src: string; alt: string; focus: string; kind: "real" | "ai" }
  | { type: "none" };

export function resolveHeroMedia(hero: CategoryContent["hero"], services: Pick<ServiceItem, "key" | "image" | "alt">[]): HeroMedia {
  if (hero.backgroundVideo?.src) {
    return { type: "video", src: hero.backgroundVideo.src, poster: hero.backgroundVideo.poster, kind: hero.image.kind };
  }
  const m = /^@service:(\w+)$/.exec(hero.image.src);
  if (m) {
    const s = services.find((x) => x.key === m[1]);
    if (!s?.image) return { type: "none" };
    return { type: "image", src: s.image, alt: hero.image.alt || s.alt, focus: hero.image.focus, kind: hero.image.kind };
  }
  if (!hero.image.src) return { type: "none" };
  return { type: "image", src: hero.image.src, alt: hero.image.alt, focus: hero.image.focus, kind: hero.image.kind };
}

export const mediaKindLabel = (kind: "real" | "ai") => (kind === "real" ? "실제 현장 사진" : "AI 연출 이미지");
