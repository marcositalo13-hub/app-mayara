import { useId } from "react";
import { cn } from "@/lib/utils";

// Bottle drawn on a 160×260 grid. Water is a tall shape whose top edge is a wave;
// the level moves it with translateY (300 ms), the wave drifts with translateX (loop).
const BOTTLE =
  "M60 28 h40 v18 q0 8 10 14 l22 12 q13 8 13 24 v136 q0 18 -18 18 h-94 q-18 0 -18 -18 v-136 q0 -16 13 -24 l22 -12 q10 -6 10 -14 z";
const EMPTY_Y = 250; // water top when empty (bottom of the body)
const FULL_Y = 62; // water top when the goal is met (just under the shoulders)

// Wavelength 80 units, drawn 320 wide, so a -160 shift loops seamlessly.
// (The vertical offset is baked into the path: a CSS animation would override a transform attribute.)
const wave = (y: number) =>
  `M0 ${y} Q20 ${y - 6} 40 ${y} T80 ${y} T120 ${y} T160 ${y} T200 ${y} T240 ${y} T280 ${y} T320 ${y} V300 H0 Z`;
const WAVE_BACK = wave(6);
const WAVE_FRONT = wave(10);

type WaterBottleProps = {
  /** 0..1 (capped by the caller). */
  fraction: number;
  label: string;
  className?: string;
};

export function WaterBottle({ fraction, label, className }: WaterBottleProps) {
  const clipId = useId();
  const top = EMPTY_Y - (EMPTY_Y - FULL_Y) * Math.min(1, Math.max(0, fraction));

  return (
    <svg viewBox="0 0 160 260" role="img" aria-label={label} className={cn("h-60 w-auto", className)}>
      <defs>
        <clipPath id={clipId}>
          <path d={BOTTLE} />
        </clipPath>
      </defs>

      <rect x="56" y="6" width="48" height="24" rx="7" className="fill-primary" />
      <path d={BOTTLE} className="fill-accent-soft" />

      <g clipPath={`url(#${clipId})`}>
        <g className="water-level" style={{ transform: `translateY(${top - 6}px)` }}>
          <path d={WAVE_BACK} className="water-wave water-wave-back fill-accent/45" />
          <path d={WAVE_FRONT} className="water-wave fill-accent" />
        </g>
      </g>

      {/* Shine and outline on top of the water. */}
      <rect x="26" y="104" width="10" height="110" rx="5" className="fill-surface/40 dark:fill-text/25" />
      <path d={BOTTLE} fill="none" strokeWidth="4" strokeLinejoin="round" className="stroke-accent/70" />
    </svg>
  );
}
