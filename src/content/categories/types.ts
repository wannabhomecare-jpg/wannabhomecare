/**
 * 카테고리 화면 문구의 타입. 문구는 고객 자료 묶음(content/*.json)을 글자 그대로 옮긴 것이다.
 * - draft: true 는 고객 확인 전 초안. 미리보기에서 '초안' 배지, 오픈 점검에서 실패로 센다.
 * - draftNote 는 점검·리포트에만 쓰고 화면에 내보내지 않는다.
 */
import type { ServiceKey } from "@/lib/services";
import type { CoatingSwatchKey } from "@/lib/theme-tokens";

export type Draftable = { draft?: boolean; draftNote?: string };

export type CategoryImage = {
  /** /real/... 경로 또는 '@service:<key>'(서비스 카드 사진) */
  src: string;
  alt: string;
  /** object-position */
  focus: string;
  kind: "real" | "ai";
};

export type CategoryVideo = { src: string; poster: string; label: string };

export type WhyCard = Draftable & {
  kicker: string;
  title: string;
  body: string;
  chips?: string[];
};

export type PrincipleItem = Draftable & {
  title: string;
  body: string;
  image?: CategoryImage;
  /** lucide-react 아이콘 이름 */
  icon?: string;
};

export type ProcessStep = Draftable & { title: string; body: string };

export type GalleryItem = { label: string; image: CategoryImage };

export type TableRow = { label: string; values: string[] };

export type FaqItem = Draftable & { q: string; a: string };

export type CategoryContent = {
  slug: ServiceKey;
  name: string;
  source: string;
  seo: { title: string; description: string };
  hero: {
    chips: string[];
    slogan: [string, string];
    lead: string | null;
    hashtags: string[];
    image: CategoryImage;
    videos: CategoryVideo[];
    /** 사진 대신 소리 없는 반복 영상(나중에 쓸 길). 지금은 값이 없다 */
    backgroundVideo?: { src: string; poster: string };
  };
  notice: string | null;
  why: { need: WhyCard; diff: WhyCard };
  principles: Draftable & {
    kicker: string;
    title: string;
    numbered?: boolean;
    items: PrincipleItem[];
  };
  process:
    | (Draftable & {
        title: string;
        steps: ProcessStep[];
        gallery?: { title: string; note: string; items: GalleryItem[] };
      })
    | null;
  beforeAfter: {
    title: string;
    note: string;
    customerSpots?: string[];
    tabs?: string[];
    waiting?: string;
  };
  scope?: Draftable & {
    title: string;
    rooms: { name: string; image: CategoryImage; items: string[] }[];
    footnote: string;
  };
  materials?: {
    title: string;
    lead: string;
    columns: string[];
    rows: { no: string; name: string; origin: string; desc: string }[];
    lineup: Draftable & { items: { name: string; body: string }[] };
    footnote: string;
  };
  grades?: Draftable & {
    title: string;
    lead: string;
    columns: string[];
    rows: TableRow[];
    footnote: string;
  };
  colors?: Draftable & {
    title: string;
    lead: string;
    lights: string[];
    swatches: { name: string; swatch: CoatingSwatchKey; fit: string }[];
    footnote: string;
  };
  compare?: Draftable & { title: string; columns: string[]; rows: TableRow[] };
  crossSell?: { title: string; body: string; href: string; source: string };
  faq: FaqItem[];
  cta: { title: string; quoteService: ServiceKey };
};
