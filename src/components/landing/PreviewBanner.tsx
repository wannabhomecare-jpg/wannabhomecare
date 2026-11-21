import { IS_PREVIEW } from "@/lib/env";

/** 미리보기 단계에서만 화면 맨 위에 보이는 얇은 띠 */
export function PreviewBanner() {
  if (!IS_PREVIEW) return null;
  return (
    <div className="flex min-h-[52px] items-center justify-center bg-brand-950 px-4 py-1.5 text-center text-[12px] leading-5 font-semibold text-brand-200 sm:min-h-8">
      미리보기 · 접수 목록은 예시이고, 카카오톡 상담과 일부 사진·후기는 준비 중입니다
    </div>
  );
}
