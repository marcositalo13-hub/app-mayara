"use client";

import { useId, useState } from "react";
import { ChevronDown, Plus, ShieldPlus, Sparkles } from "lucide-react";
import { CheckButton } from "@/components/cute";
import type { LoggedSet, SessionExercise } from "@/lib/data/workout-types";
import { cn } from "@/lib/utils";
import { formatLastPerformance, formatRest, formatTarget } from "@/lib/workout/format";
import { ExerciseIllustration } from "./exercise-illustration";
import { NumberStepper } from "./number-stepper";

type Draft = { load: number | null; reps: number | null };

type ExerciseCardProps = {
  ex: SessionExercise;
  /** Logged sets for this exercise (optimistic), by set number. */
  logged: Record<number, LoggedSet>;
  onCheck: (setNo: number, load: number | null, reps: number) => boolean;
  onUncheck: (setNo: number) => void;
  /** A logged set's values changed (parent debounces the save). */
  onEditLogged: (setNo: number, load: number | null, reps: number) => void;
};

export function ExerciseCard({ ex, logged, onCheck, onUncheck, onEditLogged }: ExerciseCardProps) {
  const hasLoad = ex.exercise.increment_kg > 0;
  const step = hasLoad ? ex.exercise.increment_kg : 0.5;
  const repsStep = ex.reps_unit === "s" ? 5 : 1;
  const maxRows = ex.sets + 2;
  const defaultLoad = hasLoad ? (ex.suggestion?.suggestedLoad ?? null) : null;

  const loggedNos = Object.keys(logged).map(Number);
  const [rows, setRows] = useState(() => Math.min(maxRows, Math.max(ex.sets, ...loggedNos)));
  const visibleRows = Math.min(maxRows, Math.max(rows, ...loggedNos));
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const [howOpen, setHowOpen] = useState(false);
  const howId = useId();

  const draftFor = (n: number): Draft =>
    drafts[n] ??
    (logged[n]
      ? { load: hasLoad ? logged[n].load_kg : null, reps: logged[n].reps }
      : { load: defaultLoad, reps: ex.reps_max });

  const plannedDone = loggedNos.filter((n) => n <= ex.sets).length;
  const complete = plannedDone >= ex.sets;

  function update(n: number, patch: Partial<Draft>) {
    const next = { ...draftFor(n), ...patch };
    setDrafts((prev) => ({ ...prev, [n]: next }));
    if (logged[n] && next.reps !== null) onEditLogged(n, next.load, next.reps);
  }

  function toggle(n: number, checked: boolean) {
    if (!checked) {
      onUncheck(n);
      return;
    }
    const d = draftFor(n);
    if (!onCheck(n, d.load, d.reps ?? ex.reps_max)) return;
    // The load just used becomes the starting point for the sets still to do.
    if (hasLoad && d.load !== null) {
      setDrafts((prev) => {
        const next = { ...prev };
        for (let m = n + 1; m <= maxRows; m++) {
          if (!logged[m]) next[m] = { ...(prev[m] ?? { reps: ex.reps_max }), load: d.load };
        }
        return next;
      });
    }
  }

  const unitLabel = ex.reps_unit === "s" ? "s" : ex.reps_unit === "passos" ? "passos" : "reps";

  return (
    <article className="flex flex-col gap-4 rounded-xl bg-surface p-4 shadow-soft ring-1 ring-border">
      <ExerciseIllustration images={ex.exercise.image_paths} name={ex.exercise.name_pt} />

      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 text-xl [overflow-wrap:anywhere]">{ex.exercise.name_pt}</h2>
          {complete && (
            <span className="shrink-0 rounded-full bg-success-soft px-3 py-1 font-bold text-success">
              Feito
            </span>
          )}
        </div>
        <p className="font-bold tabular-nums">{formatTarget(ex)}</p>
        <p className="text-text-muted">
          {ex.rest_s > 0 ? `Descanso ${formatRest(ex.rest_s)}` : "Sem descanso: siga para o próximo"}
        </p>
        {ex.note && <p className="text-text-muted [overflow-wrap:anywhere]">{ex.note}</p>}
      </div>

      <div className="flex flex-col gap-2">
        {ex.suggestion ? (
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 font-bold text-primary">
            <Sparkles aria-hidden className="size-4 shrink-0" />
            {ex.suggestion.label}
          </p>
        ) : (
          ex.hint && <p className="text-text-muted">{ex.hint}</p>
        )}
        {ex.lastPerformance && (
          <p className="text-text-muted tabular-nums [overflow-wrap:anywhere]">
            Última vez: {formatLastPerformance(ex.lastPerformance.sets, ex.reps_unit, hasLoad)}
          </p>
        )}
      </div>

      {ex.exercise.caution_pt && (
        <p className="flex gap-3 rounded-md bg-accent-soft px-4 py-3 text-accent">
          <ShieldPlus aria-hidden className="mt-0.5 size-5 shrink-0" />
          <span>{ex.exercise.caution_pt}</span>
        </p>
      )}

      {ex.exercise.instructions_pt.length > 0 && (
        <div className="rounded-md bg-surface-alt">
          <button
            type="button"
            aria-expanded={howOpen}
            aria-controls={howId}
            onClick={() => setHowOpen((v) => !v)}
            className="flex min-h-12 w-full items-center justify-between gap-2 rounded-md px-4 font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Como fazer
            <ChevronDown
              aria-hidden
              className={cn("size-5 text-text-muted transition-transform duration-250 ease-(--ease-out)", howOpen && "rotate-180")}
            />
          </button>
          <div className="expand" data-open={howOpen} id={howId} inert={!howOpen}>
            <div>
              <ol className="flex list-decimal flex-col gap-2 pr-4 pb-4 pl-9 marker:font-bold marker:text-primary">
                {ex.exercise.instructions_pt.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col divide-y divide-border">
        {Array.from({ length: visibleRows }, (_, i) => i + 1).map((n) => {
          const d = draftFor(n);
          const isExtra = n > ex.sets;
          const done = !!logged[n];
          return (
            <div key={n} className="@container py-3 first:pt-0 last:pb-0" role="group" aria-label={`Série ${n}${isExtra ? " (extra)" : ""}`}>
              <div
                className={cn(
                  "grid items-center gap-2",
                  hasLoad
                    ? "grid-cols-[minmax(0,1fr)_3rem] [grid-template-areas:'load_check'_'reps_.'] @min-[21.5rem]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3rem] @min-[21.5rem]:[grid-template-areas:'load_reps_check']"
                    : "grid-cols-[minmax(0,1fr)_3rem] [grid-template-areas:'reps_check']",
                )}
              >
                {hasLoad && (
                  <NumberStepper
                    className="[grid-area:load]"
                    value={d.load}
                    onChange={(v) => update(n, { load: v })}
                    step={step}
                    min={0}
                    max={500}
                    precision={0.5}
                    unit="kg"
                    label={`Carga da série ${n}`}
                    inputMode="decimal"
                  />
                )}
                <NumberStepper
                  className="[grid-area:reps]"
                  value={d.reps}
                  onChange={(v) => update(n, { reps: v })}
                  step={repsStep}
                  min={0}
                  max={100}
                  precision={1}
                  unit={unitLabel}
                  label={`${ex.reps_unit === "s" ? "Segundos" : "Repetições"} da série ${n}`}
                  inputMode="numeric"
                />
                <CheckButton
                  className="[grid-area:check]"
                  checked={done}
                  onCheckedChange={(c) => toggle(n, c)}
                  label={`Registrar série ${n}${isExtra ? " extra" : ""}`}
                  uncheckedContent={isExtra ? "+" : n}
                />
              </div>
            </div>
          );
        })}
      </div>

      {visibleRows < maxRows && (
        <button
          type="button"
          onClick={() => setRows(visibleRows + 1)}
          className="pressable flex min-h-12 items-center justify-center gap-2 rounded-full font-bold text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Plus aria-hidden className="size-5" />
          Série extra
        </button>
      )}
    </article>
  );
}
