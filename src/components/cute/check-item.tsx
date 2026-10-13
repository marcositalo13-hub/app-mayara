"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type CheckButtonProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Accessible name, e.g. "Marcar Almoço como feito". */
  label: string;
  className?: string;
};

/** The round 48px check on its own (controlled). Pops only when the user checks. */
export function CheckButton({ checked, onCheckedChange, label, className }: CheckButtonProps) {
  // Only a check the user just made animates; unchecking and initial/server state are instant.
  const [animate, setAnimate] = useState(false);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        setAnimate(!checked);
        onCheckedChange(!checked);
      }}
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <CheckCircle checked={checked} animate={animate} />
    </button>
  );
}

function CheckCircle({ checked, animate }: { checked: boolean; animate: boolean }) {
  return (
    <span
      aria-hidden
      data-checked={checked}
      data-animate={animate && checked}
      className={cn(
        "check-circle flex size-11 items-center justify-center rounded-full border-2",
        checked ? "border-primary bg-primary" : "border-text-muted/60 bg-surface",
      )}
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="none">
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          className="check-mark stroke-primary-foreground"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

type CheckItemProps = {
  title: string;
  subtitle?: string;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

/** A full-width row (title, subtitle, check) that toggles as a whole. */
export function CheckItem({
  title,
  subtitle,
  defaultChecked = false,
  onCheckedChange,
  className,
}: CheckItemProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const [animate, setAnimate] = useState(false);

  function toggle() {
    const next = !checked;
    setChecked(next);
    setAnimate(next);
    onCheckedChange?.(next);
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={toggle}
      className={cn(
        "flex min-h-16 w-full items-center gap-4 rounded-sm px-2 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-bold">{title}</span>
        {subtitle && <span className="text-text-muted">{subtitle}</span>}
      </span>
      <span className="flex size-12 shrink-0 items-center justify-center">
        <CheckCircle checked={checked} animate={animate} />
      </span>
    </button>
  );
}
