"use client";

import type { CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { HEART_PATH, HEART_VIEWBOX } from "./heart-shape";

const COUNT = 12;

type CelebrationBurstProps = {
  /** Called when the burst finishes so the parent can unmount it. */
  onDone?: () => void;
};

/**
 * The single showpiece animation (~700ms). Render it only while celebrating;
 * it covers the nearest positioned parent and radiates from its center.
 */
export function CelebrationBurst({ onDone }: CelebrationBurstProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {Array.from({ length: COUNT }, (_, i) => (
        <svg
          key={i}
          viewBox={HEART_VIEWBOX}
          className="burst-heart absolute size-5 fill-primary"
          style={
            {
              "--angle": `${(360 / COUNT) * i}deg`,
              "--distance": `${i % 2 ? 96 : 120}px`,
            } as CSSProperties
          }
          onAnimationEnd={i === COUNT - 1 ? onDone : undefined}
        >
          <path d={HEART_PATH} />
        </svg>
      ))}
    </div>
  );
}
