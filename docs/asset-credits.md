# 사진·로고 출처

## 사진 (`public/photos/`)

모두 AI 로 만든 연출 이미지입니다. 실제 작업 기록이 아닙니다. 원본 PNG 는 `materials/photos/` 에 있고, 사이트에는 같은 크기의 WebP(품질 85)로 바꿔 넣었습니다(`npm run build:assets`). 자르기·덧칠·합성은 하지 않았고 오른쪽 아래의 Gemini 표시도 그대로입니다.

| 파일 | 출처 | 제공 | 쓰인 자리 | 기준점 |
| --- | --- | --- | --- | --- |
| `hero-1-window.webp` | AI 생성(Gemini) | 사용자 | 첫 화면 1장(청소) | 휴대폰 `62% 22%`, PC `60% 18%` |
| `service-1-clean.webp` | AI 생성(Gemini) | 사용자 | 서비스 카드 '청소' | `center 30%` |
| `service-2-aircon.webp` | AI 생성(Gemini) | 사용자 | 서비스 카드 '에어컨청소', 첫 화면 2장 | 카드 `center 30%` · 첫 화면은 오른쪽 78% 영역 |
| `service-4-grout.webp` | AI 생성(Gemini) | 사용자 | 서비스 카드 '줄눈', 첫 화면 4장 | 카드 `center 40%` · 첫 화면은 오른쪽 78% 영역 |
| `service-6-newhome.webp` | AI 생성(Gemini) | 사용자 | 서비스 카드 '새집증후군', 첫 화면 6장 | 카드 `center` · 첫 화면은 오른쪽 78% 영역 |

준비 중(자리표시): 컬비청소, 탄성코트(서비스 카드와 첫 화면 3·5장).

푸터에 "일부 이미지는 AI로 제작한 연출 이미지입니다." 를 항상 보여 줍니다.

## 로고 (`public/logo/`, 파비콘·OG 이미지)

고객이 보낸 로고 이미지를 따서 만든 임시 벡터(`materials/logo/`)입니다. 고객에게 원본 파일을 받으면 교체합니다. 파비콘·앱 아이콘·OG 이미지는 `logo-mark.svg`·`logo-vertical.svg` 로 만들었습니다(`npm run build:assets`).

## 글꼴

Pretendard(SIL Open Font License 1.1). npm 패키지 `pretendard` 를 사이트와 함께 내보냅니다(외부 CDN 을 쓰지 않습니다).
