/**
 * 실시간 접수 목록의 예시 행 — 미리보기(preview) 단계에서만, '예시' 표시와 함께 쓴다.
 * DB 에 넣지 않는다. 이름은 이미 가린 모양이고 실제 사람이 아니다.
 * 컬비청소는 따로 접수되지 않으니 넣지 않는다.
 */

export const DEMO_SERVICE_LABELS = [
  "입주청소",
  "이사청소",
  "거주청소",
  "사이청소",
  "인테리어청소",
  "상가청소",
  "에어컨청소",
  "줄눈",
  "탄성코트",
  "새집증후군",
] as const;

export type DemoRow = {
  id: string;
  masked_name: string;
  region: string;
  service_label: (typeof DEMO_SERVICE_LABELS)[number];
};

export const DEMO_POOL: readonly DemoRow[] = [
  { id: "d01", masked_name: "김○○", region: "서울 중구", service_label: "입주청소" },
  { id: "d02", masked_name: "이○○", region: "경기 고양시", service_label: "에어컨청소" },
  { id: "d03", masked_name: "박○○", region: "서울 성동구", service_label: "이사청소" },
  { id: "d04", masked_name: "최○○", region: "인천 연수구", service_label: "줄눈" },
  { id: "d05", masked_name: "정○○", region: "서울 마포구", service_label: "거주청소" },
  { id: "d06", masked_name: "한○○", region: "경기 성남시", service_label: "탄성코트" },
  { id: "d07", masked_name: "윤○○", region: "서울 강서구", service_label: "새집증후군" },
  { id: "d08", masked_name: "조○○", region: "인천 부평구", service_label: "인테리어청소" },
  { id: "d09", masked_name: "강○○", region: "서울 송파구", service_label: "사이청소" },
  { id: "d10", masked_name: "장○○", region: "경기 수원시", service_label: "상가청소" },
  { id: "d11", masked_name: "임○○", region: "서울 노원구", service_label: "입주청소" },
  { id: "d12", masked_name: "오○○", region: "경기 용인시", service_label: "에어컨청소" },
  { id: "d13", masked_name: "서○○", region: "서울 영등포구", service_label: "이사청소" },
  { id: "d14", masked_name: "신○○", region: "경기 하남시", service_label: "줄눈" },
  { id: "d15", masked_name: "권○○", region: "인천 서구", service_label: "입주청소" },
  { id: "d16", masked_name: "황○○", region: "서울 은평구", service_label: "거주청소" },
  { id: "d17", masked_name: "안○○", region: "경기 김포시", service_label: "새집증후군" },
  { id: "d18", masked_name: "송○○", region: "서울 동작구", service_label: "탄성코트" },
  { id: "d19", masked_name: "류○○", region: "경기 화성시", service_label: "인테리어청소" },
  { id: "d20", masked_name: "홍○○", region: "인천 남동구", service_label: "이사청소" },
  { id: "d21", masked_name: "전○○", region: "서울 광진구", service_label: "사이청소" },
  { id: "d22", masked_name: "고○○", region: "경기 부천시", service_label: "에어컨청소" },
  { id: "d23", masked_name: "문○○", region: "서울 강동구", service_label: "줄눈" },
  { id: "d24", masked_name: "손○○", region: "경기 남양주시", service_label: "입주청소" },
];
