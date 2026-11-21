"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * 화면에 들어오면 떠오르며 나타나는 효과(기반 Reveal 의 움직임 그대로: 아래 60px · 0.93배 → 제자리, 0.7초).
 * 라이브러리 없이 IntersectionObserver + CSS 로 한다. 화면 밖으로 나가면 다시 숨는다(기반과 같음).
 * 움직임 줄이기 설정이면 처음부터 보인다.
 */
type Variant = "up" | "fade" | "scale" | "left" | "right";

const HIDDEN: Record<Variant, string> = {
  up: "translateY(60px) scale(0.93)",
  fade: "translateY(16px)",
  scale: "translateY(30px) scale(0.75)",
  left: "translateX(-80px) scale(0.95)",
  right: "translateX(80px) scale(0.95)",
};
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function useInViewState(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 움직임 없이 바로 보이게
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold,
      rootMargin: "0px 0px -30px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function style(variant: Variant, show: boolean, duration: number, delay: number): CSSProperties {
  return {
    opacity: show ? 1 : 0,
    transform: show ? "none" : HIDDEN[variant],
    transition: `opacity ${duration}s ${EASE} ${delay}s, transform ${duration}s ${EASE} ${delay}s`,
  };
}

export function Reveal({
  children,
  variant = "up",
  delay = 0,
  duration = 0.7,
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}) {
  const { ref, inView } = useInViewState();
  return (
    <div ref={ref} className={`motion-reduce:!transform-none motion-reduce:!opacity-100 ${className ?? ""}`} style={style(variant, inView, duration, delay)}>
      {children}
    </div>
  );
}

/** 묶음: 안의 RevealItem 들이 차례로(stagger) 나타난다 */
export function RevealGroup({
  children,
  stagger = 0.1,
  className,
}: {
  children: ReactNode;
  stagger?: number;
  threshold?: number;
  className?: string;
}) {
  const { ref, inView } = useInViewState(0.1);
  return (
    <div
      ref={ref}
      data-reveal={inView ? "show" : "hidden"}
      className={`reveal-group ${className ?? ""}`}
      style={{ ["--stagger" as string]: `${stagger}s` }}
    >
      {children}
    </div>
  );
}

export function RevealItem({ children, variant = "up", className }: { children: ReactNode; variant?: Variant; className?: string }) {
  return (
    <div className={`reveal-item ${className ?? ""}`} style={{ ["--reveal-from" as string]: HIDDEN[variant] }}>
      {children}
    </div>
  );
}
