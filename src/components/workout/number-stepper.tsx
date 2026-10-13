"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type NumberStepperProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  step: number;
  min: number;
  max: number;
  /** Typed values are rounded to this (e.g. 0.5 kg, 1 rep). */
  precision: number;
  unit: string;
  /** e.g. "Carga da série 1" */
  label: string;
  inputMode: "decimal" | "numeric";
  className?: string;
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/** − / value / + with a typeable value (numeric keypad on tap). */
export function NumberStepper({
  value,
  onChange,
  step,
  min,
  max,
  precision,
  unit,
  label,
  inputMode,
  className,
}: NumberStepperProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / precision) * precision));

  function commit(text: string) {
    const parsed = Number(text.replace(",", ".").replace(/[^\d.]/g, ""));
    if (text.trim() === "" || !Number.isFinite(parsed)) onChange(null);
    else onChange(clamp(parsed));
    setDraft(null);
  }

  const display = draft ?? (value === null ? "" : `${fmt(value)} ${unit}`);

  return (
    <div
      className={cn(
        "grid h-12 min-w-0 grid-cols-[3rem_minmax(2.5rem,1fr)_3rem] items-center rounded-full bg-surface-alt",
        className,
      )}
    >
      <button
        type="button"
        aria-label={`Diminuir ${label.toLowerCase()}`}
        disabled={value === null || value <= min}
        onClick={() => value !== null && onChange(clamp(value - step))}
        className="pressable flex size-12 items-center justify-center rounded-full text-text outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40"
      >
        <Minus className="size-5" aria-hidden />
      </button>
      <input
        type="text"
        inputMode={inputMode}
        enterKeyHint="done"
        aria-label={`${label} (${unit})`}
        placeholder={unit}
        value={display}
        onFocus={(e) => {
          setDraft(value === null ? "" : fmt(value));
          requestAnimationFrame(() => e.target.select());
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="h-12 w-full min-w-0 bg-transparent text-center text-base font-bold tabular-nums text-text outline-none placeholder:font-normal placeholder:text-text-muted"
      />
      <button
        type="button"
        aria-label={`Aumentar ${label.toLowerCase()}`}
        disabled={value !== null && value >= max}
        onClick={() => onChange(clamp(value === null ? step : value + step))}
        className="pressable flex size-12 items-center justify-center rounded-full text-text outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-40"
      >
        <Plus className="size-5" aria-hidden />
      </button>
    </div>
  );
}
