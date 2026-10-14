"use client";

import { useState } from "react";
import { Check, CircleDashed, Minus } from "lucide-react";
import { formatLiters } from "@/components/cute";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatWeekdayShortDate } from "@/lib/date";
import type { DayRecord } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { STATUS_CIRCLE, STATUS_LABEL } from "./status";

/** Summary of one day (from the month calendar). */
export function DaySheet({ day: selected, onClose }: { day: DayRecord | null; onClose: () => void }) {
  // Keep showing the last day while the sheet slides away.
  const [last, setLast] = useState<DayRecord | null>(selected);
  if (selected && selected !== last) setLast(selected);
  const day = selected ?? last;

  return (
    <Sheet open={selected !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        {day && (
          <>
            <SheetHeader>
              <SheetTitle className="first-letter:uppercase">{formatWeekdayShortDate(day.date)}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <span aria-hidden className={cn("inline-block size-3.5 rounded-full", STATUS_CIRCLE[day.status])} />
                {STATUS_LABEL[day.status]}
              </SheetDescription>
            </SheetHeader>
            <SheetBody>
              {!day.inCycle ? (
                <p className="pt-2 text-text-muted">Este dia ficou fora do plano: não há metas para ele.</p>
              ) : (
                <div className="flex flex-col gap-5 pt-2">
                  <section className="flex flex-col gap-2">
                    <h3 className="text-lg">
                      Refeições {day.mealsFollowed} de {day.mealsTotal}
                    </h3>
                    <ul className="flex flex-col divide-y divide-border rounded-md bg-surface-alt px-4">
                      {day.meals.map((m) => (
                        <li key={m.id} className="flex items-center gap-3 py-3">
                          {m.followed === true ? (
                            <Check aria-hidden className="size-5 shrink-0 text-success" />
                          ) : m.followed === false ? (
                            <Minus aria-hidden className="size-5 shrink-0 text-text-muted" />
                          ) : (
                            <CircleDashed aria-hidden className="size-5 shrink-0 text-text-muted" />
                          )}
                          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{m.name}</span>
                          <span className="shrink-0 text-text-muted">
                            {m.followed === true ? "feita" : m.followed === false ? "fora do plano" : "sem registro"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <dl className="grid grid-cols-1 gap-2">
                    <Row label="Água">
                      {formatLiters(day.waterMl)} L{day.waterTarget ? ` de ${formatLiters(day.waterTarget)} L` : ""}
                    </Row>
                    <Row label="Treino">
                      {day.workouts.length > 0
                        ? day.workouts.map((w) => `${w.code} — ${w.name}`).join(", ")
                        : "Nenhum"}
                    </Row>
                    <Row label="Cardio">{day.cardioMinutes > 0 ? `${day.cardioMinutes} min` : "Nenhum"}</Row>
                  </dl>
                </div>
              )}
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-md bg-surface-alt px-4 py-3">
      <dt className="font-bold">{label}</dt>
      <dd className="min-w-0 text-right tabular-nums [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}
