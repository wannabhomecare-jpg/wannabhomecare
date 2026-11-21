"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { setSiteContent } from "@/lib/site-content";
import { SERVICE_KEYS } from "@/lib/services";

const frame = z.object({
  position: z.string().trim().min(1).max(40).regex(/^[a-z0-9.%\s-]+$/i),
  scale: z.number().min(1).max(3),
  origin: z.string().trim().max(40).regex(/^[a-z0-9.%\s-]*$/i).optional(),
});

const slide = z.object({
  service: z.enum(SERVICE_KEYS),
  chips: z.array(z.string().trim().min(1).max(30)).min(1).max(8),
  title1: z.string().trim().min(1).max(40),
  title2: z.string().trim().max(40).optional(),
  lead: z.string().trim().max(120).optional(),
  slogan1: z.string().trim().min(1).max(80),
  slogan2: z.string().trim().min(1).max(80),
  hashtags: z.array(z.string().trim().min(1).max(30)).max(8),
  image: z
    .string()
    .regex(/^\/photos\/[a-z0-9-]+\.webp$/)
    .nullable(),
  alt: z.string().trim().max(120),
  layout: z.enum(["cover", "right"]),
  mobile: frame,
  desktop: frame,
});

export async function saveHeroSlides(slides: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdmin();
  const parsed = z.array(slide).min(1).max(7).safeParse(slides);
  if (!parsed.success) return { ok: false, error: "입력값을 확인해 주세요." };
  await setSiteContent("hero_slides", parsed.data);
  revalidatePath("/");
  return { ok: true };
}
