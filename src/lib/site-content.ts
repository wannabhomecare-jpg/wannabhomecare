import { createSupabaseAnonClient } from "@/lib/supabase/anon";
import { isSupabaseConfigured } from "@/lib/env";
import { DEFAULT_SERVICES, type ServiceItem } from "@/lib/services";
import { BEFORE_AFTER_KEY, REVIEWS_KEY, normalizeBeforeAfter, normalizeReviews } from "@/lib/media-items";
import type {
  BeforeAfterItem,
  HeroSlideData,
  LiveBoardSettings,
  PromiseSectionData,
  ReviewCaptureData,
  ServiceOverride,
} from "@/types/database";

// ============================================================
// 기본값 — DB 에 값이 없을 때 쓴다.
// 히어로 6장의 문구는 고객이 쓴 글자 그대로다(띄어쓰기·오타만 다듬음). 고치지 않는다.
// ============================================================

const SLOGAN2 = "꿈이 아닙니다, 우리가 만들겠습니다.";

export const DEFAULT_HERO_SLIDES: HeroSlideData[] = [
  {
    service: "clean",
    chips: ["이사청소", "거주청소", "사이청소", "신축입주청소", "인테리어청소"],
    title1: "서울·경기·인천",
    title2: "원스톱 홈케어",
    slogan1: "깨끗한 집, 쾌적한 집!",
    slogan2: SLOGAN2,
    hashtags: ["100%직영팀", "완전탈거분해", "친환경세제", "작업사진공유"],
    image: "/photos/hero-1-window.webp",
    alt: "거실 창틀의 시공 먼지를 닦는 청소 직원",
    layout: "cover",
    mobile: { position: "left 20%", scale: 1.44, origin: "left 10%" },
    desktop: { position: "left 30%", scale: 1.18, origin: "left 0%" },
  },
  {
    service: "aircon",
    chips: ["벽걸이", "스탠드", "2IN1", "시스템에어컨"],
    title1: "에어컨청소",
    lead: "필터만 씻으면 끝? 진짜 곰팡이는 '안쪽'에 있습니다.",
    slogan1: "곰팡이 냄새 나가! 숨 쉬기 편한 상쾌한 바람!",
    slogan2: SLOGAN2,
    hashtags: ["정밀완전분해", "친환경고압세척", "고온스팀살균", "완벽건조"],
    image: "/photos/service-2-aircon.webp",
    alt: "벽걸이 에어컨에 세척 커버를 씌우고 안쪽을 세척하는 직원",
    layout: "right",
    mobile: { position: "0% 25%", scale: 1 },
    desktop: { position: "center 30%", scale: 1 },
  },
  {
    service: "kirby",
    chips: ["벽지손상 ZERO", "동물털 ZERO", "알레르겐 ZERO", "미세분진 ZERO"],
    title1: "컬비청소기",
    lead: "미세 공사 분진, 반려동물 털·비듬은 일반 청소만으로는 완벽 제거되지 않습니다",
    slogan1: "먼지 ZERO, 털·비듬 걱정 ZERO!",
    slogan2: SLOGAN2,
    hashtags: ["천장벽지분진제거", "천장벽지반려동물털제거", "초미세먼지역류차단", "최종클린검수"],
    image: null,
    alt: "",
    layout: "cover",
    mobile: { position: "center", scale: 1 },
    desktop: { position: "center", scale: 1 },
  },
  {
    service: "grout",
    chips: ["폴리우레아", "아덱스", "케라폭시", "스타라이크"],
    title1: "줄눈시공",
    lead: "지긋지긋한 누런 때·곰팡이 OUT",
    slogan1: "변색 없는 줄눈, 청소 걱정 없는 욕실!",
    slogan2: SLOGAN2,
    hashtags: ["정밀한밑작업", "백시멘트분진완벽제거", "정량주입마감", "시공하자1년A/S"],
    image: "/photos/service-4-grout.webp",
    alt: "욕실 바닥 타일 틈에 줄눈제를 채우는 손",
    layout: "right",
    mobile: { position: "center 40%", scale: 1.25, origin: "right 0%" },
    desktop: { position: "center 40%", scale: 1 },
  },
  {
    service: "coating",
    chips: ["바이오세라믹", "에어로젤", "규조토", "스톤/나노"],
    title1: "탄성코트",
    lead: "베란다·세탁실 곰팡이·결로, 아직도 페인트칠 하세요?",
    slogan1: "결로 없는 베란다, 곰팡이 없는 세탁실!",
    slogan2: SLOGAN2,
    hashtags: ["꼼꼼한보양", "들뜬페인트제거", "정석2회도포", "완벽검수"],
    image: null,
    alt: "",
    layout: "cover",
    mobile: { position: "center", scale: 1 },
    desktop: { position: "center", scale: 1 },
  },
  {
    service: "newhome",
    chips: ["임산부", "자녀", "반려동물", "선택이 아닌 필수"],
    title1: "새집증후군",
    lead: "청소와 환기만으로는 유해물질은 막을 수 없습니다",
    slogan1: "유해물질 ZERO, 숨 쉬기 편한 새집!",
    slogan2: SLOGAN2,
    hashtags: ["시공전수치측정", "오존산화분해", "포름알데히드OUT", "유기화합물OUT"],
    image: "/photos/service-6-newhome.webp",
    alt: "보호복을 입고 방 안에 안개를 분사하는 작업자",
    layout: "right",
    mobile: { position: "center", scale: 1.3, origin: "right 35%" },
    desktop: { position: "center", scale: 1 },
  },
];

export const DEFAULT_PROMISE: PromiseSectionData = {
  kicker: "OUR PROMISE",
  title: "맡기기 전에 가장 궁금한 것부터\n먼저 약속드립니다",
  cards: [
    {
      key: "area",
      icon: "map",
      body: "서울·경기·인천,\n수도권 어디든 작업합니다.",
      title: "수도권 전 지역",
    },
    {
      key: "direct",
      icon: "none",
      visualText: "100%",
      body: "3주 이상 본사 교육을 마친\n팀장만 현장에 투입합니다.",
      title: "100% 직영팀 운영",
    },
    {
      key: "insurance",
      icon: "shield",
      body: "소중한 공간에서 만일의 사고가 생겨도\n보험으로 끝까지 책임집니다.",
      bodyMobile: "만일의 사고가 생겨도 보험으로 끝까지 책임집니다.",
      title: "배상책임보험 가입",
    },
  ],
};

export const DEFAULT_LIVE_BOARD: LiveBoardSettings = { enabled: true };

// ============================================================
// 읽기 (공개 — 공개 키)
// ============================================================

export async function getSiteContent<T>(key: string, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    const supabase = createSupabaseAnonClient();
    const { data } = await supabase.from("site_content").select("value").eq("key", key).maybeSingle();
    if (data?.value) return data.value as T;
  } catch {
    // DB 오류면 기본값
  }
  return fallback;
}

// ============================================================
// 쓰기 (관리자 — 서버 키)
// ============================================================

export async function setSiteContent(key: string, value: unknown): Promise<void> {
  const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("site_content")
    .upsert({ key, value: value as never }, { onConflict: "key" });
  if (error) throw new Error(`site_content 저장 실패: ${error.message}`);
}

export const getHeroSlides = () => getSiteContent<HeroSlideData[]>("hero_slides", DEFAULT_HERO_SLIDES);
export const getPromiseSection = () => getSiteContent<PromiseSectionData>("promise_section", DEFAULT_PROMISE);
export const getReviewCaptures = async (): Promise<ReviewCaptureData[]> =>
  normalizeReviews(await getSiteContent<unknown>(REVIEWS_KEY, []));
export const getBeforeAfter = async (): Promise<BeforeAfterItem[]> =>
  normalizeBeforeAfter(await getSiteContent<unknown>(BEFORE_AFTER_KEY, []));
export const getLiveBoardSettings = () => getSiteContent<LiveBoardSettings>("live_board", DEFAULT_LIVE_BOARD);

/** 서비스 목록: 기본 목록 + 관리자에서 바꾼 이름·한 줄 */
export async function getServices(): Promise<ServiceItem[]> {
  const overrides = await getSiteContent<ServiceOverride[]>("services", []);
  const byKey = new Map(overrides.map((o) => [o.key, o]));
  return DEFAULT_SERVICES.map((s) => {
    const o = byKey.get(s.key);
    return { ...s, name: o?.name?.trim() || s.name, summary: o?.summary?.trim() || s.summary };
  });
}
