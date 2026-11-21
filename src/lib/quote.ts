/**
 * 30초 무료 견적 문의 — 질문·선택지·순서.
 * 선택지 이름과 2번의 설명은 고객이 쓴 글자 그대로다(2026-11-19 작업지시서). 고치지 않는다.
 * 화면(QuoteWizard)과 서버 검증(submit-quote), 테스트가 이 파일을 함께 쓴다.
 */

import { z } from "zod";

export const QUOTE_SERVICES = ["clean", "aircon", "grout", "coating", "newhome"] as const;
export type QuoteService = (typeof QUOTE_SERVICES)[number];

export const QUOTE_SERVICE_LABEL: Record<QuoteService, string> = {
  clean: "청소",
  aircon: "에어컨청소",
  grout: "줄눈",
  coating: "탄성코트",
  newhome: "새집증후군",
};

/** 2번 — 청소의 형태(이름 · 설명) */
export const CLEAN_TYPES = [
  { label: "이사청소", desc: "기존 세입자 퇴거 후, 빈집 상태의 공간을 쾌적하게 정돈하는 청소" },
  { label: "거주청소", desc: "현재 거주 중인 공간의 묵은 때와 생활 오염을 집중적으로 제거하는 청소" },
  {
    label: "사이청소",
    desc: "기존 세입자 퇴거와 신규 입주 사이의 짧은 시간 동안 신속하게 진행하는 당일 맞춤 청소",
  },
  { label: "입주청소", desc: "신축 건물 입주 전, 공사 먼지와 유해 분진을 완벽하게 제거하는 청소" },
  { label: "인테리어청소", desc: "인테리어·리모델링 완료 후 남은 잔여물과 미세 분진을 정리하는 청소" },
  { label: "쓰레기집청소", desc: "방치된 쓰레기와 폐기물을 처리하고, 오염된 공간을 원상 복구하는 청소" },
  { label: "상가청소", desc: "사무실, 식당, 매장 등 상업 공간의 청결을 관리하는 맞춤형 청소" },
] as const;
export const COMMERCIAL_CLEAN = "상가청소";

/** 3번 — 건물의 형태 */
export const BUILDING_TYPES = [
  "아파트",
  "주상복합",
  "오피스텔",
  "빌라",
  "단독주택",
  "타운하우스",
  "기타 (직접 입력)",
] as const;

/** 3-1번 — 업종(상가청소) */
export const BUSINESS_TYPES = [
  "사무실 / 오피스",
  "식당 / 카페 (요식업)",
  "학원 / 교습소 / 스터디카페",
  "병원 / 의원 / 약국",
  "미용실 / 네일샵 / 에스테틱 (뷰티)",
  "헬스장 / 필라테스 / 요가 (체육시설)",
  "일반 매장 / 쇼룸 / 판매점",
  "기타 (직접 입력)",
] as const;
export const OTHER_OPTION = "기타 (직접 입력)";

/** 4·5·6번 */
export const ROOM_COUNTS = [1, 2, 3, 4, 5, 6] as const;
export const BATH_COUNTS = [1, 2, 3, 4] as const;
export const BALCONY_COUNTS = [1, 2, 3, 4, 5, 6] as const;

/** 7번 */
export const STRUCTURE_TYPES = ["복층", "해당 사항 없음"] as const;

/** 8번 — 함께 알아보시는 견적(컬비청소는 여기에만 있다) */
export const EXTRA_SERVICES = ["컬비청소", "에어컨청소", "줄눈", "탄성코트", "새집증후군"] as const;

export type QuoteAnswers = {
  service?: QuoteService;
  cleanType?: string;
  buildingType?: string;
  buildingOther?: string;
  businessType?: string;
  businessOther?: string;
  rooms?: number;
  bathrooms?: number;
  balconies?: number;
  structure?: string;
  extras: string[];
  area?: string;
  sido?: string;
  sigungu?: string;
  addressDetail?: string;
  preferredDate?: string;
  customerName?: string;
  phone?: string;
  consent?: boolean;
  message?: string;
};

export const EMPTY_ANSWERS: QuoteAnswers = { extras: [] };

export type StepId =
  | "service"
  | "cleanType"
  | "building"
  | "business"
  | "rooms"
  | "structure"
  | "extras"
  | "area"
  | "address"
  | "date"
  | "contact"
  | "message";

/** 화면 위에 보이는 짧은 이름 */
export const STEP_LABEL: Record<StepId, string> = {
  service: "서비스 선택",
  cleanType: "청소 형태",
  building: "건물 형태",
  business: "업종",
  rooms: "방 · 화장실 · 베란다",
  structure: "구조",
  extras: "함께 알아보는 견적",
  area: "평수",
  address: "주소",
  date: "날짜",
  contact: "연락처",
  message: "요청사항",
};

/**
 * 고른 답에 따라 지나갈 질문 순서.
 * 집 청소: 1 → 2 → 3 → 4·5·6 → 7 → 8 → 9–13
 * 상가청소: 1 → 2 → 3-1 → 8 → 9–13
 * 그 밖의 서비스: 1 → 9–13
 * (14번 완료 화면은 제출 뒤에 보인다)
 */
export function stepsFor(a: Pick<QuoteAnswers, "service" | "cleanType">): StepId[] {
  const tail: StepId[] = ["area", "address", "date", "contact", "message"];
  if (a.service !== "clean") return ["service", ...tail];
  if (!a.cleanType) return ["service", "cleanType", ...tail];
  if (a.cleanType === COMMERCIAL_CLEAN) return ["service", "cleanType", "business", "extras", ...tail];
  return ["service", "cleanType", "building", "rooms", "structure", "extras", ...tail];
}

/** 이 질문에 답했는지(8번·13번은 선택이라 늘 true) */
export function isStepComplete(step: StepId, a: QuoteAnswers): boolean {
  switch (step) {
    case "service":
      return !!a.service;
    case "cleanType":
      return !!a.cleanType;
    case "building":
      return !!a.buildingType && (a.buildingType !== OTHER_OPTION || !!a.buildingOther?.trim());
    case "business":
      return !!a.businessType && (a.businessType !== OTHER_OPTION || !!a.businessOther?.trim());
    case "rooms":
      return !!a.rooms && !!a.bathrooms && !!a.balconies;
    case "structure":
      return !!a.structure;
    case "extras":
      return true;
    case "area":
      return !!a.area?.trim();
    case "address":
      return !!a.sido && !!a.sigungu && !!a.addressDetail?.trim();
    case "date":
      return !!a.preferredDate?.trim();
    case "contact":
      return !!a.customerName?.trim() && PHONE_RE.test((a.phone ?? "").trim()) && a.consent === true;
    case "message":
      return true;
  }
}

export const PHONE_RE = /^01[016-9]-?\d{3,4}-?\d{4}$/;

/** 고른 길에서 쓰이지 않는 답은 지운다(돌아가서 다른 길을 골랐을 때) */
export function pruneAnswers(a: QuoteAnswers): QuoteAnswers {
  const steps = new Set(stepsFor(a));
  const out: QuoteAnswers = { ...a, extras: [...a.extras] };
  if (!steps.has("cleanType")) delete out.cleanType;
  if (!steps.has("building")) {
    delete out.buildingType;
    delete out.buildingOther;
  }
  if (out.buildingType !== OTHER_OPTION) delete out.buildingOther;
  if (!steps.has("business")) {
    delete out.businessType;
    delete out.businessOther;
  }
  if (out.businessType !== OTHER_OPTION) delete out.businessOther;
  if (!steps.has("rooms")) {
    delete out.rooms;
    delete out.bathrooms;
    delete out.balconies;
  }
  if (!steps.has("structure")) delete out.structure;
  if (!steps.has("extras")) out.extras = [];
  return out;
}

/** 서버에서 쓰는 검증. 고른 길에 필요한 답이 모두 있어야 통과한다. */
const trimmed = (max: number) => z.string().trim().max(max);

export const quotePayloadSchema = z
  .object({
    service: z.enum(QUOTE_SERVICES),
    cleanType: z.enum(CLEAN_TYPES.map((c) => c.label) as [string, ...string[]]).optional(),
    buildingType: z.enum(BUILDING_TYPES).optional(),
    buildingOther: trimmed(50).optional(),
    businessType: z.enum(BUSINESS_TYPES).optional(),
    businessOther: trimmed(50).optional(),
    rooms: z.number().int().min(1).max(6).optional(),
    bathrooms: z.number().int().min(1).max(4).optional(),
    balconies: z.number().int().min(1).max(6).optional(),
    structure: z.enum(STRUCTURE_TYPES).optional(),
    extras: z.array(z.enum(EXTRA_SERVICES)).max(EXTRA_SERVICES.length).default([]),
    area: trimmed(30).min(1, "평수를 적어 주세요"),
    sido: z.enum(["서울", "경기", "인천"]),
    sigungu: trimmed(20).min(1),
    addressDetail: trimmed(100).min(1, "나머지 주소를 적어 주세요"),
    preferredDate: trimmed(40).min(1, "날짜를 적어 주세요"),
    customerName: trimmed(20).min(1, "성함을 적어 주세요"),
    phone: z.string().trim().regex(PHONE_RE, "휴대폰 번호를 확인해 주세요"),
    consent: z.literal(true),
    message: trimmed(1000).optional(),
  })
  .superRefine((v, ctx) => {
    for (const step of stepsFor(v)) {
      if (!isStepComplete(step, { ...v, extras: v.extras ?? [] })) {
        ctx.addIssue({ code: "custom", path: [step], message: `${STEP_LABEL[step]}을(를) 확인해 주세요` });
      }
    }
  });

export type QuotePayload = z.infer<typeof quotePayloadSchema>;

export function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  return d.replace(/^(\d{3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
}

/** 공개 목록의 서비스 칩: 청소면 청소 형태, 나머지는 서비스 이름 */
export function boardServiceLabel(service: string, cleanType: string | null | undefined): string {
  if (service === "clean" && cleanType) return cleanType;
  return QUOTE_SERVICE_LABEL[service as QuoteService] ?? "기타";
}

/** 이름 가리기: 첫 글자 + ○○ (예: 김○○) */
export function maskName(name: string): string {
  const t = name.trim();
  if (!t) return "고객";
  return `${Array.from(t)[0]}○○`;
}
