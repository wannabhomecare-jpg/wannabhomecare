/**
 * CSS 밖에서 색 값이 꼭 필요한 곳(브라우저 테마 색 등)에만 쓰는 토큰.
 * 값은 src/app/globals.css 의 @theme 과 같다.
 */
export const BRAND_600 = "#356BA7";

/**
 * 탄성코트 '컬러 미리보기' 견본 색(예시 — 협력업체 색상표가 오면 바꾼다).
 * 카테고리 문구 파일에는 색 값을 두지 않고 이 이름으로 부른다.
 */
export const COATING_SWATCHES = {
  snowWhite: "#F4F3EE",
  pearlWhite: "#EEEAE0",
  creamIvory: "#EFE5CF",
  lightGray: "#D9DADA",
  auroraSilver: "#CDD1D6",
} as const;
export type CoatingSwatchKey = keyof typeof COATING_SWATCHES;
