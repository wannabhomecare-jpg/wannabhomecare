/**
 * 다른 회사 로고 모양 아이콘. 색은 currentColor 로 받아 토큰으로 칠한다.
 */

type IconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

/** 카카오톡 말풍선 */
export function KakaoBubble({ className = "", ...rest }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" {...rest}>
      <path d="M12 3.6c-5.08 0-9.2 3.24-9.2 7.24 0 2.6 1.75 4.88 4.38 6.16l-1.1 4.02c-.1.35.3.63.6.42l4.7-3.12c.2.01.41.02.62.02 5.08 0 9.2-3.24 9.2-7.5S17.08 3.6 12 3.6z" />
    </svg>
  );
}

/** 인스타그램 모양(선) */
export function InstagramGlyph({ className = "", ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
