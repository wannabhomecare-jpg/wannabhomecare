import { SERVICE_KEYS, type ServiceKey } from "@/lib/services";
import type { CategoryContent } from "./types";
import { clean } from "./clean";
import { aircon } from "./aircon";
import { kirby } from "./kirby";
import { grout } from "./grout";
import { coating } from "./coating";
import { newhome } from "./newhome";

export const CATEGORIES: Record<ServiceKey, CategoryContent> = { clean, aircon, kirby, grout, coating, newhome };

export function isCategorySlug(slug: string): slug is ServiceKey {
  return (SERVICE_KEYS as readonly string[]).includes(slug);
}

export function getCategory(slug: string): CategoryContent | null {
  return isCategorySlug(slug) ? CATEGORIES[slug] : null;
}

export type DraftEntry = { slug: ServiceKey; name: string; item: string; note?: string };

/** 남은 초안 목록(카테고리 · 항목 · draftNote). check:launch 와 리포트가 쓴다. */
export function listDrafts(): DraftEntry[] {
  const out: DraftEntry[] = [];
  for (const c of Object.values(CATEGORIES)) {
    const add = (item: string, d: { draft?: boolean; draftNote?: string } | null | undefined) => {
      if (d?.draft) out.push({ slug: c.slug, name: c.name, item, note: d.draftNote });
    };
    add("왜 필요한가요", c.why.need);
    add("무엇이 다른가요", c.why.diff);
    add("원칙", c.principles);
    c.principles.items.forEach((p, i) => add(`원칙 ${i + 1} '${p.title}'`, p));
    add("작업 프로세스", c.process);
    c.process?.steps.forEach((s, i) => add(`프로세스 ${i + 1}단계 '${s.title}'`, s));
    add("청소 범위", c.scope);
    add("자재 라인업", c.materials?.lineup);
    add("도료 종류", c.grades);
    add("컬러 미리보기", c.colors);
    add("방법 비교", c.compare);
    c.faq.forEach((f, i) => add(`질문 ${i + 1} '${f.q}'`, f));
  }
  return out;
}
