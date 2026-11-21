import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * 공개 데이터(사이트 문구, 공개 접수 목록 뷰) 읽기용 공개 키 클라이언트.
 * 견적 요청 표는 공개 키로 읽을 수 없다(RLS·권한으로 막혀 있다).
 */

let cached: SupabaseClient<Database> | null = null;

export function createSupabaseAnonClient(): SupabaseClient<Database> {
  if (cached) return cached;
  const { url, anonKey } = getSupabaseConfig();
  cached = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}
