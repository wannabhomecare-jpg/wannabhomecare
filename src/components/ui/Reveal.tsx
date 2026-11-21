"use client";

import { useRef } from "react";
import {
  motion,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";

type Variant = "up" | "fade" | "scale" | "left" | "right";

type Props = {
  children: ReactNode;
  variant?: Variant;
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
};

const VARIANTS: Record<Variant, Variants> = {
  up: {
    hidden: { opacity: 0, y: 60, scale: 0.93 },
    show: { opacity: 1, y: 0, scale: 1 },
  },
  fade: {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.75, y: 30 },
    show: { opacity: 1, scale: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: -80, scale: 0.95 },
    show: { opacity: 1, x: 0, scale: 1 },
  },
  right: {
    hidden: { opacity: 0, x: 80, scale: 0.95 },
    show: { opacity: 1, x: 0, scale: 1 },
  },
};

export function Reveal({
  children,
  variant = "up",
  delay = 0,
  duration = 0.7,
  threshold = -30,
  className,
}: Props) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: false,
    margin: `0px 0px ${threshold}px 0px`,
    amount: 0.15,
  });

  // 움직임 줄이기 설정이면 같은 요소를 그대로 두고 바로 보이게 한다(구조가 바뀌면 화면이 숨은 채로 남는다)
  return (
    <motion.div
      ref={ref}
      variants={VARIANTS[variant]}
      initial="hidden"
      animate={reduce || isInView ? "show" : "hidden"}
      transition={reduce ? { duration: 0 } : { duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  children,
  stagger = 0.1,
  threshold = -30,
  className,
}: {
  children: ReactNode;
  stagger?: number;
  threshold?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: false,
    margin: `0px 0px ${threshold}px 0px`,
    amount: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={reduce || isInView ? "show" : "hidden"}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: reduce ? 0 : stagger } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  children,
  variant = "up",
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={VARIANTS[variant]}
      transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
