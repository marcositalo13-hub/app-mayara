"use client";

import { Heart } from "lucide-react";
import { useNow } from "@/hooks/use-now";
import { formatClock } from "@/lib/workout/format";

export type RestState = {
  id: number;
  /** Absolute end time (epoch ms): stays correct after screen lock or background. */
  endsAt: number;
  durationMs: number;
  done: boolean;
};

const RING_R = 16;
const RING_C = 2 * Math.PI * RING_R;

/**
 * Floating rest pill above the bottom nav. The ring is redrawn once per second from the
 * absolute end time (a discrete readout, not a CSS animation). Tap skips/dismisses.
 */
export function RestTimer({ rest, onDismiss }: { rest: RestState | null; onDismiss: () => void }) {
  const now = useNow();
  if (!rest) return null;

  const remainingMs = now === null ? rest.durationMs : Math.max(0, rest.endsAt - now);
  const done = rest.done || remainingMs === 0;
  const fraction = rest.durationMs > 0 ? remainingMs / rest.durationMs : 0;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-30 flex justify-center px-4">
      <button
        type="button"
        onClick={onDismiss}
        aria-label={done ? "Fechar aviso de descanso" : `Descanso: faltam ${formatClock(remainingMs / 1000)}. Toque para pular.`}
        className="pressable pointer-events-auto flex min-h-14 items-center gap-3 rounded-full bg-text py-1.5 pr-5 pl-1.5 text-background shadow-soft outline-none transition-[opacity,translate] duration-200 ease-(--ease-out) focus-visible:ring-3 focus-visible:ring-ring/50 starting:translate-y-2 starting:opacity-0"
      >
        {done ? (
          <>
            <span className="flex size-11 items-center justify-center rounded-full bg-primary">
              <Heart aria-hidden className="size-5 fill-primary-foreground text-primary-foreground" />
            </span>
            <span className="font-extrabold" role="status">
              Bora para a próxima!
            </span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 40 40" className="size-11 -rotate-90" aria-hidden>
              <circle cx="20" cy="20" r={RING_R} fill="none" strokeWidth="4" className="stroke-background/25" />
              <circle
                cx="20"
                cy="20"
                r={RING_R}
                fill="none"
                strokeWidth="4"
                strokeLinecap="round"
                className="stroke-primary"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - fraction)}
              />
            </svg>
            <span className="flex flex-col items-start leading-tight">
              <span className="text-lg font-extrabold tabular-nums">{formatClock(remainingMs / 1000)}</span>
              <span className="opacity-80">Descanso · toque para pular</span>
            </span>
          </>
        )}
      </button>
    </div>
  );
}
