"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export const CUP_ML = 250;

/** 1250 → "1,25" (pt-BR decimal comma). */
export const formatLiters = (ml: number) =>
  (ml / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

type WaterTrackerProps = {
  /** Number of 250 mL cups shown (goal / 250). */
  cups?: number;
  /** Controlled number of filled cups. Omit for uncontrolled use. */
  filled?: number;
  defaultFilled?: number;
  onChange?: (filled: number) => void;
  /** Show the "x L de y L" line (hide when the screen already shows it). */
  showLabel?: boolean;
  className?: string;
};

export function WaterTracker({
  cups = 10,
  filled: filledProp,
  defaultFilled = 0,
  onChange,
  showLabel = true,
  className,
}: WaterTrackerProps) {
  const [filledState, setFilledState] = useState(defaultFilled);
  const filled = Math.min(cups, filledProp ?? filledState);

  // Balanced rows of at most 5 cups: 6 → 3+3, 8 → 4+4, 10 → 5+5.
  const rows = Math.max(1, Math.ceil(cups / 5));
  const perRow = Math.ceil(cups / rows);

  function tap(index: number) {
    let next: number;
    if (index === filled) next = filled + 1; // next empty cup: fill it
    else if (index === filled - 1) next = filled - 1; // last filled cup: empty it
    else return;
    if (filledProp === undefined) setFilledState(next);
    onChange?.(next);
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        className="grid justify-center gap-2"
        style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 3rem))` }}
      >
        {Array.from({ length: cups }, (_, i) => {
          const isFilled = i < filled;
          const actionable = i === filled || i === filled - 1;
          return (
            <button
              key={i}
              type="button"
              data-filled={isFilled}
              aria-pressed={isFilled}
              aria-disabled={!actionable}
              aria-label={`Copo ${i + 1} de ${CUP_ML} mL`}
              onClick={() => tap(i)}
              className="cup pressable flex aspect-square w-full items-center justify-center rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <svg viewBox="0 0 32 40" className="h-10 w-8" aria-hidden>
                <path d="M7 9h18l-2 26H9z" className="cup-water fill-accent" />
                <path
                  d="M4 4h24l-3 32H7z"
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  className={isFilled ? "stroke-accent" : "stroke-text-muted"}
                />
              </svg>
            </button>
          );
        })}
      </div>
      {showLabel && (
        <p className="text-center font-bold tabular-nums" aria-live="polite">
          {formatLiters(filled * CUP_ML)} L de {formatLiters(cups * CUP_ML)} L
        </p>
      )}
    </div>
  );
}
