/**
 * DB 표 타입(수기). supabase/migrations 와 맞춘다.
 */

// ============================================================
// quote_requests — 30초 무료 견적 문의
// ============================================================

export type RequestStatus = "pending" | "quote" | "active" | "done";

export const STATUS_ORDER: readonly RequestStatus[] = ["pending", "quote", "active", "done"] as const;

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: "견적접수",
  quote: "상담진행",
  active: "작업진행",
  done: "작업완료",
};

export type QuoteRequest = {
  id: string;
  created_at: string;
  updated_at: string;
  service: string;
  clean_type: string | null;
  building_type: string | null;
  building_other: string | null;
  business_type: string | null;
  business_other: string | null;
  rooms: number | null;
  bathrooms: number | null;
  balconies: number | null;
  structure: string | null;
  extra_services: string[];
  area: string;
  sido: string;
  sigungu: string;
  address_detail: string;
  preferred_date: string;
  customer_name: string;
  masked_name: string;
  phone: string;
  message: string | null;
  image_paths: string[];
  consent_at: string;
  status: RequestStatus;
  admin_memo: string | null;
  visible_on_board: boolean;
  is_test: boolean;
};

export type QuoteRequestInsert = Omit<
  QuoteRequest,
  | "id"
  | "created_at"
  | "updated_at"
  | "masked_name"
  | "status"
  | "admin_memo"
  | "visible_on_board"
  | "is_test"
  | "extra_services"
  | "image_paths"
> & {
  extra_services?: string[];
  image_paths?: string[];
  status?: RequestStatus;
  visible_on_board?: boolean;
  is_test?: boolean;
};

/** 공개 목록 뷰(quote_request_board)의 열. 성함 전체·연락처·나머지 주소·요청 내용·사진은 없다. */
export type QuoteBoardItem = {
  id: string;
  masked_name: string;
  region: string;
  service_label: string;
  status: RequestStatus;
  created_at: string;
};

// ============================================================
// site_content — 메인 문구(키-값)
// ============================================================

export type SiteContent = {
  key: string;
  value: unknown;
  updated_at: string;
};

export type SiteContentInsert = {
  key: string;
  value: unknown;
};

// ============================================================
// 사이트 콘텐츠 JSON 타입
// ============================================================

export type ImageFrame = {
  /** object-position (예: "left 20%") */
  position: string;
  /** 확대 배율(1 = 칸에 꽉 채움) */
  scale: number;
  /** 확대 기준점(transform-origin). 없으면 position 과 같다 */
  origin?: string;
};

export type HeroSlideData = {
  service: string;
  /** 세부 항목 버튼 */
  chips: string[];
  title1: string;
  title2?: string;
  /** 2–6장: 제목 아래 굵은 한 줄 */
  lead?: string;
  slogan1: string;
  slogan2: string;
  hashtags: string[];
  /** 사진 없으면 '사진 준비 중' 자리표시 */
  image: string | null;
  alt: string;
  /** cover: 칸에 꽉 / right: 오른쪽 78% 영역에 채우고 왼쪽은 brand-950 */
  layout: "cover" | "right";
  mobile: ImageFrame;
  desktop: ImageFrame;
};

export type PromiseCardData = {
  key: string;
  icon: "map" | "shield" | "none";
  visualText?: string;
  body: string;
  bodyMobile?: string;
  title: string;
};

export type PromiseSectionData = {
  kicker: string;
  title: string;
  cards: PromiseCardData[];
};

export type ReviewCaptureData = {
  id: string;
  image: string;
  service: string;
  region: string;
  month: string;
  published: boolean;
};

export type LiveBoardSettings = {
  enabled: boolean;
};

export type ServiceOverride = {
  key: string;
  name?: string;
  summary?: string;
};

// ============================================================
// Database 제네릭 — supabase-js 클라이언트에 넣는다
// ============================================================

export type Database = {
  public: {
    Tables: {
      quote_requests: {
        Row: QuoteRequest;
        Insert: QuoteRequestInsert;
        Update: Partial<QuoteRequestInsert> &
          Partial<Pick<QuoteRequest, "status" | "admin_memo" | "visible_on_board">>;
        Relationships: [];
      };
      site_content: {
        Row: SiteContent;
        Insert: SiteContentInsert;
        Update: Partial<SiteContentInsert>;
        Relationships: [];
      };
    };
    Views: { quote_request_board: { Row: QuoteBoardItem; Relationships: [] } };
    Functions: Record<string, never>;
  };
};
