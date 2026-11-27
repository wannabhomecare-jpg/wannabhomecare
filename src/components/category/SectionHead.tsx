import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";

/** 블록 제목(메인과 같은 규칙): 작은 영문 머리말 → 큰 제목 → 한 줄 설명 */
export function SectionHead({
  id,
  kicker,
  title,
  lead,
  dark = false,
  badge,
}: {
  id: string;
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
  dark?: boolean;
  badge?: ReactNode;
}) {
  return (
    <Reveal variant="up" className="max-w-3xl sm:mx-auto sm:text-center">
      <p className={`section-kicker ${dark ? "section-kicker-dark" : ""}`}>{kicker}</p>
      <h2
        id={id}
        className={`mt-3 text-[1.6rem] font-black tracking-tight sm:mt-4 sm:text-4xl lg:text-[2.6rem] ${dark ? "text-white" : "text-brand-900"}`}
      >
        {title}
        {badge}
      </h2>
      {lead && <p className={`mt-3 text-[15px] leading-7 sm:mt-4 sm:text-lg ${dark ? "text-brand-100" : "text-slate-600"}`}>{lead}</p>}
    </Reveal>
  );
}
