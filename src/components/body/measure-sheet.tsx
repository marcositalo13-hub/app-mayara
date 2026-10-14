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
import type { BodyPoint, MeasurementResult, SaveMeasurementInput } from "@/lib/data/body-types";
import {
  formatBody,
  parseDecimal,
  roundWaist,
  roundWeight,
  WAIST_RANGE,
  WEIGHT_RANGE,
} from "@/lib/body/format";
import { addDays, formatWeekdayAbbrDate } from "@/lib/date";
import { cn } from "@/lib/utils";

const DAYS_BACK = 7;

type MeasureSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 'YYYY-MM-DD' from the server. */
  today: string;
  daily: BodyPoint[];
  saveMeasurement: (input: SaveMeasurementInput) => Promise<MeasurementResult>;
};

export function MeasureSheet({ open, onOpenChange, today, daily, saveMeasurement }: MeasureSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Registrar medidas</SheetTitle>
          <SheetDescription>
            Preencha o que quiser: só o peso, só a cintura ou os dois.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {/* Remounts on each open so the form starts fresh. */}
          {open && (
            <MeasureForm
              today={today}
              daily={daily}
              saveMeasurement={saveMeasurement}
              onSaved={() => onOpenChange(false)}
            />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

const asField = (value: number | null) => (value === null ? "" : formatBody(value));

function MeasureForm({
  today,
  daily,
  saveMeasurement,
  onSaved,
}: Pick<MeasureSheetProps, "today" | "daily" | "saveMeasurement"> & { onSaved: () => void }) {
  const dates = Array.from({ length: DAYS_BACK + 1 }, (_, i) => addDays(today, -i));
  const existing = (date: string) => daily.find((d) => d.date === date);

  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState(() => asField(existing(today)?.weightKg ?? null));
  const [waist, setWaist] = useState(() => asField(existing(today)?.waistCm ?? null));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const hasExisting = !!existing(date);

  function pickDate(next: string) {
    setDate(next);
    setError(null);
    // Prefill with what is already saved for that day.
    const row = existing(next);
    setWeight(asField(row?.weightKg ?? null));
    setWaist(asField(row?.waistCm ?? null));
  }

  /** Normalizes a field on blur so rounding is visible before saving (72,456 → 72,5). */
  function normalize(kind: "weight" | "waist") {
    const text = kind === "weight" ? weight : waist;
    const parsed = parseDecimal(text);
    if (parsed === null) {
      if (kind === "weight") setWeight("");
      else setWaist("");
      return;
    }
    const rounded = kind === "weight" ? roundWeight(parsed) : roundWaist(parsed);
    if (kind === "weight") setWeight(formatBody(rounded));
    else setWaist(formatBody(rounded));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseDecimal(weight);
    const c = parseDecimal(waist);

    if (w === null && c === null) {
      setError("Informe o peso ou a cintura.");
      return;
    }
    const weightKg = w === null ? null : roundWeight(w);
    const waistCm = c === null ? null : roundWaist(c);
    if (weightKg !== null && (weightKg < WEIGHT_RANGE.min || weightKg > WEIGHT_RANGE.max)) {
      setError(`O peso deve ficar entre ${WEIGHT_RANGE.min} e ${WEIGHT_RANGE.max} kg.`);
      return;
    }
    if (waistCm !== null && (waistCm < WAIST_RANGE.min || waistCm > WAIST_RANGE.max)) {
      setError(`A cintura deve ficar entre ${WAIST_RANGE.min} e ${WAIST_RANGE.max} cm.`);
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await saveMeasurement({ measuredOn: date, weightKg, waistCm });
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message, { id: "measure-error" });
        return;
      }
      toast.success("Medidas salvas");
      onSaved();
    });
  }

  const inputClass =
    "h-12 w-full min-w-0 rounded-md border border-border bg-surface px-4 pr-12 text-base font-bold tabular-nums text-text outline-none placeholder:font-normal placeholder:text-text-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-primary";

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 pt-2" noValidate>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-lg font-extrabold">Dia</legend>
        <div role="radiogroup" aria-label="Dia da medida" className="grid grid-cols-4 gap-2">
          {dates.map((d, i) => {
            const selected = d === date;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => pickDate(d)}
                className={cn(
                  "pressable min-h-12 rounded-md px-1 py-1.5 text-center leading-tight font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  selected ? "bg-primary text-primary-foreground" : "bg-surface-alt text-text",
                )}
              >
                {i === 0 ? "Hoje" : i === 1 ? "Ontem" : formatWeekdayAbbrDate(d)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-lg font-extrabold">Peso</span>
          <span className="relative">
            <input
              name="weight"
              type="text"
              inputMode="decimal"
              enterKeyHint="next"
              autoComplete="off"
              placeholder="0,0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onBlur={() => normalize("weight")}
              aria-invalid={error ? true : undefined}
              className={inputClass}
            />
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-text-muted">
              kg
            </span>
          </span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-lg font-extrabold">Cintura</span>
          <span className="relative">
            <input
              name="waist"
              type="text"
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              placeholder="0,0"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              onBlur={() => normalize("waist")}
              aria-invalid={error ? true : undefined}
              className={inputClass}
            />
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-text-muted">
              cm
            </span>
          </span>
        </label>
      </div>

      <p className="text-text-muted">
        Pese-se em jejum, depois de fazer xixi, sempre na mesma balança. Cintura na linha do umbigo.
      </p>
      {hasExisting && (
        <p className="text-text-muted">
          Já existe um registro neste dia. Campos vazios não mudam o que está salvo.
        </p>
      )}

      <p role="alert" aria-live="polite" className="min-h-6 font-bold text-text">
        {error}
      </p>

      <Button size="lg" type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
