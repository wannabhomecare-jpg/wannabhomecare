/**
 * 서비스(카테고리) 목록 — 헤더, 모바일 메뉴, 서비스 6칸, 히어로, 견적이 모두 이 목록을 쓴다.
 * 이름·순서는 나중에 관리자에서 바꿀 수 있게 site_content("services")로 덮어쓸 수 있다.
 */

export const SERVICE_KEYS = ["clean", "aircon", "kirby", "grout", "coating", "newhome"] as const;
export type ServiceKey = (typeof SERVICE_KEYS)[number];

export type ServiceItem = {
  key: ServiceKey;
  /** 영문 주소 이름(Phase 2 카테고리 화면 주소) */
  slug: ServiceKey;
  name: string;
  /** 서비스 카드의 한 줄 */
  summary: string;
  /** public/ 아래 사진 경로. 없으면 '사진 준비 중' 자리표시 */
  image: string | null;
  alt: string;
  /** 서비스 카드 사진 기준점(object-position) */
  focus: string;
  /** 견적 1번 선택지에 나오는지(컬비청소는 연계 상품이라 아니다) */
  inQuoteFirst: boolean;
  /** 견적 1번 선택지 아래 작은 글씨 */
  quoteHint: string;
};

export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    key: "clean",
    slug: "clean",
    name: "청소",
    summary: "이사 · 거주 · 사이 · 신축입주 · 인테리어",
    image: "/photos/service-1-clean.webp",
    alt: "새 아파트 주방 서랍의 시공 먼지를 닦는 직원",
    focus: "center 30%",
    inQuoteFirst: true,
    quoteHint: "이사 · 거주 · 사이 · 입주 · 인테리어 · 쓰레기집 · 상가",
  },
  {
    key: "aircon",
    slug: "aircon",
    name: "에어컨청소",
    summary: "벽걸이 · 스탠드 · 2IN1 · 시스템에어컨",
    image: "/photos/service-2-aircon.webp",
    alt: "벽걸이 에어컨에 세척 커버를 씌우고 안쪽을 세척하는 직원",
    focus: "center 30%",
    inQuoteFirst: true,
    quoteHint: "벽걸이 · 스탠드 · 2IN1 · 시스템에어컨",
  },
  {
    key: "kirby",
    slug: "kirby",
    name: "컬비청소",
    summary: "천장·벽지 분진, 반려동물 털 제거",
    image: null,
    alt: "",
    focus: "center",
    inQuoteFirst: false,
    quoteHint: "",
  },
  {
    key: "grout",
    slug: "grout",
    name: "줄눈",
    summary: "폴리우레아 · 아덱스 · 케라폭시 · 스타라이크",
    image: "/photos/service-4-grout.webp",
    alt: "욕실 바닥 타일 틈에 줄눈제를 채우는 손",
    focus: "center 40%",
    inQuoteFirst: true,
    quoteHint: "폴리우레아 · 아덱스 · 케라폭시 · 스타라이크",
  },
  {
    key: "coating",
    slug: "coating",
    name: "탄성코트",
    summary: "베란다·세탁실 곰팡이·결로",
    image: null,
    alt: "",
    focus: "center",
    inQuoteFirst: true,
    quoteHint: "베란다 · 세탁실 곰팡이·결로",
  },
  {
    key: "newhome",
    slug: "newhome",
    name: "새집증후군",
    summary: "임산부 · 자녀 · 반려동물이 있는 집",
    image: "/photos/service-6-newhome.webp",
    alt: "보호복을 입고 방 안에 안개를 분사하는 작업자",
    focus: "center",
    inQuoteFirst: true,
    quoteHint: "시공 전 수치 측정 · 오존 산화 분해",
  },
];

export function isServiceKey(v: unknown): v is ServiceKey {
  return typeof v === "string" && (SERVICE_KEYS as readonly string[]).includes(v);
}

export function serviceName(key: string | null | undefined, list = DEFAULT_SERVICES): string {
  return list.find((s) => s.key === key)?.name ?? "기타";
}
