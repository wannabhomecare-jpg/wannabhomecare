import { z } from "zod";

/**
 * 환경변수 읽기. 값이 없어도 빌드는 통과한다(화면은 자리표시·안내로 대신한다).
 * 비밀값은 serverEnv() 로만 읽고, 브라우저 번들에 들어가지 않는다.
 */

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .trim()
    .url()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v.replace(/\/+$/, "") : "http://localhost:3000")),
  NEXT_PUBLIC_SITE_NAME: optionalString,
  NEXT_PUBLIC_SITE_STAGE: optionalString,
  NEXT_PUBLIC_PHONE: optionalString,
  NEXT_PUBLIC_KAKAO_CHANNEL_URL: optionalString,
  NEXT_PUBLIC_SUPABASE_URL: optionalString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  NEXT_PUBLIC_NAVER_VERIFICATION: optionalString,
  NEXT_PUBLIC_GOOGLE_VERIFICATION: optionalString,
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  ADMIN_PASSWORD: optionalString,
  SESSION_SECRET: optionalString,
});

// NEXT_PUBLIC_* 는 빌드 때 글자 그대로 바뀌므로 하나씩 적는다.
const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
  NEXT_PUBLIC_SITE_STAGE: process.env.NEXT_PUBLIC_SITE_STAGE,
  NEXT_PUBLIC_PHONE: process.env.NEXT_PUBLIC_PHONE,
  NEXT_PUBLIC_KAKAO_CHANNEL_URL: process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_NAVER_VERIFICATION: process.env.NEXT_PUBLIC_NAVER_VERIFICATION,
  NEXT_PUBLIC_GOOGLE_VERIFICATION: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
});
if (!parsedPublic.success) {
  console.error("[env] invalid public env:", parsedPublic.error.flatten().fieldErrors);
  throw new Error("Invalid NEXT_PUBLIC_* environment variables");
}

export const publicEnv = parsedPublic.data;

export type SiteStage = "preview" | "production";

/** 값이 정확히 production 일 때만 오픈 단계. 그 밖에는 모두 미리보기로 본다. */
export const SITE_STAGE: SiteStage =
  publicEnv.NEXT_PUBLIC_SITE_STAGE === "production" ? "production" : "preview";
export const IS_PREVIEW = SITE_STAGE === "preview";

export const siteConfig = {
  url: publicEnv.NEXT_PUBLIC_SITE_URL,
  name: publicEnv.NEXT_PUBLIC_SITE_NAME ?? "워너비홈케어",
  stage: SITE_STAGE,
} as const;

let cachedServer: z.infer<typeof serverSchema> | null = null;
export function serverEnv() {
  if (cachedServer) return cachedServer;
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() called in the browser");
  }
  cachedServer = serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    SESSION_SECRET: process.env.SESSION_SECRET,
  });
  return cachedServer;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Supabase 공개 주소·키. 없으면 에러(호출하는 쪽에서 isSupabaseConfigured 로 먼저 거른다). */
export function getSupabaseConfig() {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 없습니다.");
  }
  return { url, anonKey };
}

/** Supabase 서버 키. 서버 전용. */
export function getSupabaseAdminConfig() {
  const url = publicEnv.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = serverEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없습니다.");
  }
  return { url, serviceRole };
}

/** 관리자 비밀번호와 세션 서명 값. 서버 전용. */
export function getAdminCredentials() {
  const env = serverEnv();
  const password = env.ADMIN_PASSWORD;
  const secret = env.SESSION_SECRET;
  if (!password || password.length < 8 || !secret || secret.length < 32) {
    throw new Error(
      "관리자 인증 정보가 없습니다. ADMIN_PASSWORD(8자 이상) / SESSION_SECRET(32자 이상)을 넣어 주세요.",
    );
  }
  return { password, secret };
}
