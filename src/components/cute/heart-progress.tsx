"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { HEART_PATH, HEART_VIEWBOX } from "./heart-shape";

type HeartProgressProps = {
  /** 0–100 */
  value: number;
  size?: number;
  label?: string;
  className?: string;
};

export function HeartProgress({
  value,
  size = 160,
  label = "do dia",
  className,
}: HeartProgressProps) {
  const clipId = useId();
  const pct = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <svg
        viewBox={HEART_VIEWBOX}
        width={size}
        height={(size * 22) / 24}
        role="img"
        aria-label={`${pct}% ${label}`}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={HEART_PATH} />
          </clipPath>
        </defs>
        <path d={HEART_PATH} className="fill-primary-soft" />
        <g clipPath={`url(#${clipId})`}>
          {/* Full-size rect slid down; translateY keeps the fill on the compositor. */}
          <rect
            x="0"
            y="0"
            width="24"
            height="22"
            className="heart-fill fill-primary"
            style={{ transform: `translateY(${22 - (22 * pct) / 100}px)` }}
          />
        </g>
      </svg>
      <p className="text-2xl font-extrabold tabular-nums" aria-hidden>
        {pct}%
      </p>
    </div>
  );
}
