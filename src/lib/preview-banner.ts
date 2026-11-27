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
