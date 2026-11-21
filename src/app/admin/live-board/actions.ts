"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { setSiteContent } from "@/lib/site-content";

export async function saveLiveBoardEnabled(enabled: boolean): Promise<{ ok: boolean }> {
  await assertAdmin();
  const v = z.boolean().safeParse(enabled);
  if (!v.success) return { ok: false };
  await setSiteContent("live_board", { enabled: v.data });
  revalidatePath("/");
  revalidatePath("/admin/live-board");
  return { ok: true };
}
