"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const CUPS = 10;
const CUP_LITERS = 0.25;

const liters = (n: number) =>
  (n * CUP_LITERS).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

type WaterTrackerProps = {
  defaultFilled?: number;
  onChange?: (filled: number) => void;
  className?: string;
};

export function WaterTracker({
  defaultFilled = 0,
  onChange,
  className,
}: WaterTrackerProps) {
  const [filled, setFilled] = useState(defaultFilled);

  function tap(index: number) {
    let next: number;
    if (index === filled) next = filled + 1; // next empty cup: fill it
    else if (index === filled - 1) next = filled - 1; // last filled cup: empty it
    else return;
    setFilled(next);
    onChange?.(next);
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="grid grid-cols-5 justify-items-center gap-2">
        {Array.from({ length: CUPS }, (_, i) => {
          const isFilled = i < filled;
          const actionable = i === filled || i === filled - 1;
          return (
            <button
              key={i}
              type="button"
              data-filled={isFilled}
              aria-pressed={isFilled}
              aria-disabled={!actionable}
              aria-label={`Copo ${i + 1} de 250 mL`}
              onClick={() => tap(i)}
              className="cup pressable flex size-14 items-center justify-center rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
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
      <p className="text-center font-bold" aria-live="polite">
        {liters(filled)} L de {liters(CUPS)} L
      </p>
    </div>
  );
}
