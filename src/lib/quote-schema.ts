/**
 * 30초 무료 견적 — 서버 검증(브라우저 번들에 넣지 않으려고 따로 둔다).
 */
import { z } from "zod";
import {
  BUILDING_TYPES,
  BUSINESS_TYPES,
  CLEAN_TYPES,
  EXTRA_SERVICES,
  isStepComplete,
  PHONE_RE,
  QUOTE_SERVICES,
  STEP_LABEL,
  stepsFor,
  STRUCTURE_TYPES,
} from "./quote";

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
