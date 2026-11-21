import Image from "next/image";
import Link from "next/link";
import { BUSINESS } from "@/lib/business";

type Variant = "horizontal-white" | "horizontal" | "vertical-white";

const FILES: Record<Variant, { src: string; w: number; h: number }> = {
  "horizontal-white": { src: "/logo/logo-horizontal-white.svg", w: 1232.6, h: 240.8 },
  horizontal: { src: "/logo/logo-horizontal.svg", w: 1232.6, h: 240.8 },
  "vertical-white": { src: "/logo/logo-vertical-white.svg", w: 877.5, h: 638 },
};

/**
 * 로고 — materials/logo 의 SVG 를 그대로 쓴다(색·비율·모양을 바꾸지 않는다).
 * height 만 정하면 너비는 비율대로 정해진다.
 */
export function Logo({
  variant = "horizontal-white",
  height = 40,
  imgClassName = "",
  priority = false,
}: {
  variant?: Variant;
  height?: number;
  /** 폭별 높이를 바꿀 때(예: "h-[30px] md:h-[34px] w-auto") */
  imgClassName?: string;
  priority?: boolean;
}) {
  const f = FILES[variant];
  const width = Math.round((f.w / f.h) * height);
  return (
    <Link href="/" className="inline-flex shrink-0 items-center" aria-label={`${BUSINESS.name} 홈으로`}>
      <Image
        src={f.src}
        alt={BUSINESS.name}
        width={width}
        height={height}
        priority={priority}
        unoptimized
        className={imgClassName}
      />
    </Link>
  );
}
