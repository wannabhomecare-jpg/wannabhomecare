/** 미리보기 띠 문구 — 아직 준비 중인 것만 적는다. */
export function previewBannerText({
  kakao,
  photosPending,
}: {
  kakao: boolean;
  photosPending: boolean;
}): string {
  const pending = [!kakao && "카카오톡 상담", photosPending ? "일부 사진·후기" : "후기"].filter(
    Boolean,
  );
  return `미리보기 · 접수 목록은 예시이고, ${pending.join("과 ")}는 준비 중입니다`;
}

/** 카테고리 화면에 초안이 남아 있을 때 띠에 더하는 한 줄 */
export const DRAFT_BANNER_LINE = "카테고리 화면의 '초안' 표시 문구는 대표님 확인 후 바꿉니다.";
