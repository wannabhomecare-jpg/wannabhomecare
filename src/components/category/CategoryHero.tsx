import Image from "next/image";
import Link from "next/link";
import type { CategoryContent } from "@/content/categories/types";
import type { ServiceItem } from "@/lib/services";
import { mediaKindLabel, resolveHeroMedia } from "@/lib/category-media";
import { HeroVideos } from "./HeroVideos";
import { HeroBackgroundVideo } from "./HeroBackgroundVideo";

/**
 * 카테고리 첫 화면: 왼쪽 글(빵부스러기 · 알약 · 슬로건 · lead · 해시태그), 오른쪽 사진.
 * 휴대폰은 사진 위, 글 아래.
 */
export function CategoryHero({ c, services }: { c: CategoryContent; services: ServiceItem[] }) {
  const media = resolveHeroMedia(c.hero, services);
  const hasMedia = media.type !== "none";

  return (
    <section aria-labelledby="category-title" className="brand-grid relative isolate overflow-hidden bg-brand-950 text-white">
      {hasMedia && (
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[62%]">
          {media.type === "image" ? (
            <Image
              src={media.src}
              alt={media.alt}
              fill
              priority
              sizes="(min-width: 1024px) 62vw, 100vw"
              style={{ objectPosition: media.focus }}
              className="object-cover"
            />
          ) : (
            <HeroBackgroundVideo src={media.src} poster={media.poster} />
          )}
          <div aria-hidden className="absolute inset-0 hidden bg-gradient-to-r from-brand-950 via-brand-950/55 to-transparent lg:block lg:w-1/2" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-brand-950/70 to-transparent lg:hidden" />
          <span className="absolute top-3 right-3 rounded-full bg-brand-950/70 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/20 backdrop-blur">
            {mediaKindLabel(media.kind)}
          </span>
          {c.hero.videos.length > 0 && (
            <div className="absolute right-3 bottom-3 sm:right-5 sm:bottom-5">
              <HeroVideos videos={c.hero.videos} />
            </div>
          )}
        </div>
      )}

      <div className="relative mx-auto flex max-w-(--container-content) px-4 py-9 sm:px-6 sm:py-12 lg:min-h-[520px] lg:items-center lg:py-16">
        <div className={hasMedia ? "lg:max-w-[46%]" : "max-w-3xl"}>
          <nav aria-label="현재 위치" className="text-[13px] font-bold text-brand-200 sm:text-sm">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-white hover:underline">
                  워너비홈케어
                </Link>
              </li>
              <li aria-hidden>·</li>
              <li aria-current="page" className="text-white">
                {c.name}
              </li>
            </ol>
          </nav>

          <ul className="mt-4 flex flex-wrap gap-2" aria-label="세부 항목">
            {c.hero.chips.map((chip) => (
              <li key={chip} className="rounded-full bg-brand-600 px-3 py-1.5 text-[13px] font-bold text-white sm:px-4 sm:text-[15px]">
                {chip}
              </li>
            ))}
          </ul>

          <h1 id="category-title" className="mt-5 font-black tracking-tight sm:mt-6">
            <span className="sr-only">{c.name}: </span>
            <span className="block text-[1.85rem] leading-tight text-white sm:text-5xl lg:text-[3.2rem]">{c.hero.slogan[0]}</span>
            <span className="mt-3 block text-[1.05rem] font-bold text-brand-200 sm:text-xl">{c.hero.slogan[1]}</span>
          </h1>

          {c.notice && <p className="mt-3 text-[13px] leading-6 text-brand-200 sm:text-sm">{c.notice}</p>}

          {c.hero.lead && (
            <p className="mt-5 text-[17px] leading-7 font-extrabold text-white sm:text-xl">{c.hero.lead}</p>
          )}

          <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1.5 text-[14px] font-bold text-brand-300 sm:text-[15px]" aria-label="해시태그">
            {c.hero.hashtags.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
