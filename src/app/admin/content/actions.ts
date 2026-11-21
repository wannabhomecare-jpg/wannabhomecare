"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { setSiteContent } from "@/lib/site-content";
import { SERVICE_KEYS } from "@/lib/services";

type Result = { ok: true } | { ok: false; error: string };

const promiseSchema = z.object({
  kicker: z.string().trim().min(1).max(40),
  title: z.string().trim().min(1).max(120),
  cards: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(30),
        icon: z.enum(["map", "shield", "none"]),
        visualText: z.string().trim().max(10).optional(),
        body: z.string().trim().min(1).max(200),
        bodyMobile: z.string().trim().max(200).optional(),
        title: z.string().trim().min(1).max(40),
      }),
    )
    .length(3),
});

export async function savePromise(data: unknown): Promise<Result> {
  await assertAdmin();
  const parsed = promiseSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: "입력값을 확인해 주세요." };
  await setSiteContent("promise_section", parsed.data);
  revalidatePath("/");
  return { ok: true };
}

const servicesSchema = z.array(
  z.object({
    key: z.enum(SERVICE_KEYS),
    name: z.string().trim().min(1).max(20),
    summary: z.string().trim().min(1).max(60),
  }),
);

export async function saveServices(data: unknown): Promise<Result> {
  await assertAdmin();
  const parsed = servicesSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: "입력값을 확인해 주세요." };
  await setSiteContent("services", parsed.data);
  revalidatePath("/");
  return { ok: true };
}
