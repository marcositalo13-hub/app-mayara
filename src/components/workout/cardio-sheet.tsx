"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { CardioAction, CardioWeek } from "@/lib/data/workout-types";
import { cn } from "@/lib/utils";
import {
  CARDIO_MODALITIES,
  CARDIO_MODALITY_LABELS,
  type CardioModality,
  rpeLabel,
} from "@/lib/workout/format";
import { NumberStepper } from "./number-stepper";

type CardioSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  week: CardioWeek | null;
  logCardio: CardioAction;
  onSaved?: () => void;
};

export function CardioSheet({ open, onOpenChange, week, logCardio, onSaved }: CardioSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Registrar cardio</SheetTitle>
          {week && (
            <SheetDescription>
              Meta da semana: {week.targetMinutes} min em {week.targetSessions}{" "}
              {week.targetSessions === 1 ? "sessão" : "sessões"}, PSE {week.rpeMin}
              {week.rpeMax !== week.rpeMin ? `–${week.rpeMax}` : ""}.
            </SheetDescription>
          )}
        </SheetHeader>
        <SheetBody>
          {/* Remounts on each open so the defaults are fresh. */}
          {open && (
            <CardioForm
              week={week}
              logCardio={logCardio}
              onSaved={() => {
                onOpenChange(false);
                onSaved?.();
              }}
            />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

function CardioForm({
  week,
  logCardio,
  onSaved,
}: {
  week: CardioWeek | null;
  logCardio: CardioAction;
  onSaved: () => void;
}) {
  const defaultMinutes =
    week && week.targetSessions > 0 ? Math.round(week.targetMinutes / week.targetSessions) : 20;
  const [minutes, setMinutes] = useState<number | null>(Math.min(180, Math.max(1, defaultMinutes)));
  const [rpe, setRpe] = useState<number>(week?.rpeMin ?? 6);
  const [modality, setModality] = useState<CardioModality>("escada");
  const [pending, startTransition] = useTransition();

  const inTarget = (n: number) => !!week && n >= week.rpeMin && n <= week.rpeMax;

  function save() {
    if (!minutes) {
      toast.error("Informe os minutos.", { id: "cardio-error" });
      return;
    }
    startTransition(async () => {
      const result = await logCardio({ minutes, rpe, modality });
      if (!result.ok) {
        toast.error(result.message, { id: "cardio-error" });
        return;
      }
      toast.success("Cardio registrado");
      onSaved();
    });
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      <section className="flex flex-col gap-2">
        <h3 className="text-lg">Tempo</h3>
        <NumberStepper
          value={minutes}
          onChange={setMinutes}
          step={5}
          min={1}
          max={180}
          precision={1}
          unit="min"
          label="Minutos de cardio"
          inputMode="numeric"
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg">Esforço (PSE)</h3>
          {week && (
            <span className="text-text-muted">
              Meta {week.rpeMin}
              {week.rpeMax !== week.rpeMin ? `–${week.rpeMax}` : ""}
            </span>
          )}
        </div>
        <div role="radiogroup" aria-label="Esforço percebido de 1 a 10" className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const selected = n === rpe;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`${n}: ${rpeLabel(n)}${inTarget(n) ? " (meta)" : ""}`}
                onClick={() => setRpe(n)}
                className={cn(
                  "pressable h-12 rounded-md font-extrabold tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : inTarget(n)
                      ? "bg-primary-soft text-primary ring-1 ring-primary/40"
                      : "bg-surface-alt text-text-muted",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
        <p className="min-h-6 font-bold text-text" aria-live="polite">
          {rpe} · {rpeLabel(rpe)}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-lg">Modalidade</h3>
        <div role="radiogroup" aria-label="Modalidade" className="grid grid-cols-2 gap-2">
          {CARDIO_MODALITIES.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={m === modality}
              onClick={() => setModality(m)}
              className={cn(
                "pressable min-h-12 rounded-md font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                m === modality ? "bg-surface text-primary shadow-soft ring-1 ring-primary/40" : "bg-surface-alt text-text-muted",
              )}
            >
              {CARDIO_MODALITY_LABELS[m]}
            </button>
          ))}
        </div>
      </section>

      <Button size="lg" onClick={save} disabled={pending} aria-busy={pending}>
        {pending ? "Salvando..." : "Salvar cardio"}
      </Button>
    </div>
  );
}
