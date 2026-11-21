/**
 * 사업자 정보(고객 제공, 2026-11-20). 주소는 고객 요청으로 "서울특별시 중구"까지만 쓴다.
 * 연락처(전화·카카오)는 환경변수에서 읽는다(contact.ts).
 */

import { getContactInfo } from "./contact";
import { siteConfig } from "./env";

export const BUSINESS = {
  name: siteConfig.name,
  nameEn: "WANNA.B HOMECARE",
  url: siteConfig.url,
  legalName: "워너비홈케어",
  representative: "노인철",
  businessRegNo: "176-13-02907",
  address: "서울특별시 중구",
  instagramHandle: "wannab.homecare",
  instagramUrl: "https://www.instagram.com/wannab.homecare",
  serviceAreas: ["서울특별시", "경기도", "인천광역시"] as const,
  tagline: "견적부터 마무리까지, 끝까지 책임집니다",
  contact: getContactInfo(),
} as const;
