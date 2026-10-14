"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CelebrationBurst, formatLiters, HeartProgress } from "@/components/cute";
import { Card, CardContent } from "@/components/ui/card";
import type { TodayActions, TodayData, TodayMeal } from "@/lib/data/today-types";
import { MealCard } from "./meal-card";
import { SwapsSheet } from "./swaps-sheet";

type OkData = Extract<TodayData, { status: "ok" }>;
/** mealId → logged optionId (null when the log has no option). Presence = done. */
type LogMap = Record<string, string | null>;
type LogChange = { mealId: string; optionId: string | null; done: boolean };

const CELEBRATED_KEY = "mayara:celebrated-on";

const toLogMap = (logs: OkData["mealLogs"]): LogMap =>
  Object.fromEntries(logs.map((l) => [l.meal_id, l.option_id]));

function applyChange(state: LogMap, { mealId, optionId, done }: LogChange): LogMap {
  const next = { ...state };
  if (done) next[mealId] = optionId;
  else delete next[mealId];
  return next;
}

/**
 * Day progress, 0–100: each meal counts 1, water counts up to 1 (capped at the goal).
 * (meals done + min(water / goal, 1)) / (meals + 1) × 100
 */
export function dayProgress(mealIds: string[], logs: LogMap, waterMl: number, waterGoalMl: number) {
  const mealsDone = mealIds.filter((id) => id in logs).length;
  const water = waterGoalMl > 0 ? Math.min(waterMl / waterGoalMl, 1) : 1;
  return ((mealsDone + water) / (mealIds.length + 1)) * 100;
}

type TodayViewProps = {
  data: OkData;
  actions: TodayActions;
};

/** Dieta tab: day progress (meals + water, read-only here), meals and swaps. */
export function TodayView({ data, actions }: TodayViewProps) {
  const goalMl = data.week.water_ml_target;
  // Water is edited on the Água tab; here it only counts toward the heart.
  const waterMl = data.waterMl;
  const mealIds = data.meals.map((m) => m.id);

  // Confirmed state starts from the server and follows it whenever new props arrive
  // (after revalidation); optimistic layers sit on top while a write is in flight.
  const [synced, setSynced] = useState(data);
  const [confirmedLogs, setConfirmedLogs] = useState(() => toLogMap(data.mealLogs));
  if (synced !== data) {
    setSynced(data);
    setConfirmedLogs(toLogMap(data.mealLogs));
  }

  const [logs, applyLog] = useOptimistic(confirmedLogs, applyChange);
  const [, startMealTransition] = useTransition();

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [celebrating, setCelebrating] = useState(false);
  const celebratedThisLoad = useRef(false);

  const progress = dayProgress(mealIds, logs, waterMl, goalMl);
  const mealsDone = mealIds.filter((id) => id in logs).length;

  function maybeCelebrate(before: number, after: number) {
    if (before >= 100 || after < 100 || celebratedThisLoad.current) return;
    celebratedThisLoad.current = true;
    try {
      // At most once per day; without storage it still fires at most once per page load.
      if (localStorage.getItem(CELEBRATED_KEY) === data.today) return;
      localStorage.setItem(CELEBRATED_KEY, data.today);
    } catch {}
    setCelebrating(true);
  }

  function selectedOptionFor(meal: TodayMeal): string {
    const logged = logs[meal.id];
    const candidates = [logged, selected[meal.id]];
    for (const id of candidates) {
      if (id && meal.options.some((o) => o.id === id)) return id;
    }
    return meal.options[0].id;
  }

  function saveMeal(meal: TodayMeal, optionId: string, done: boolean) {
    const change: LogChange = { mealId: meal.id, optionId: done ? optionId : null, done };
    const nextLogs = applyChange(logs, change);
    const wasAllDone = mealIds.length > 0 && mealIds.every((id) => id in logs);
    const willAllDone = mealIds.length > 0 && mealIds.every((id) => id in nextLogs);
    maybeCelebrate(progress, dayProgress(mealIds, nextLogs, waterMl, goalMl));

    startMealTransition(async () => {
      applyLog(change);
      const result = await actions.setMealDone({ mealId: meal.id, optionId, done });
      if (!result.ok) {
        toast.error(result.message, { id: "save-error" });
        return;
      }
      setConfirmedLogs((prev) => applyChange(prev, change));
      if (willAllDone && !wasAllDone) toast.success("Todas as refeições feitas");
    });
  }

  function selectOption(meal: TodayMeal, optionId: string) {
    setSelected((prev) => ({ ...prev, [meal.id]: optionId }));
    // On a done meal, the log follows the chosen option.
    if (meal.id in logs && logs[meal.id] !== optionId) saveMeal(meal, optionId, true);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="relative flex items-center gap-5">
          <HeartProgress value={progress} size={104} label="do dia concluído" className="shrink-0" />
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-xl">Seu dia</h2>
            {mealIds.length > 0 && (
              <p className="text-text-muted tabular-nums">
                {mealsDone} de {mealIds.length} {mealIds.length === 1 ? "refeição" : "refeições"}
              </p>
            )}
            <Link
              href="/agua"
              className="-mx-1 -my-3 rounded-sm px-1 py-3 text-text-muted tabular-nums underline decoration-text-muted/40 decoration-dotted underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {formatLiters(waterMl)} L de {formatLiters(goalMl)} L de água
            </Link>
          </div>
          {celebrating && <CelebrationBurst onDone={() => setCelebrating(false)} />}
        </CardContent>
      </Card>

      <section aria-labelledby="meals-title" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="meals-title" className="text-xl">
            Refeições
          </h2>
          {data.swapGroups.length > 0 && <SwapsSheet groups={data.swapGroups} />}
        </div>
        {data.meals.length > 0 ? (
          <div className="flex flex-col gap-3">
            {data.meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                done={meal.id in logs}
                selectedOptionId={selectedOptionFor(meal)}
                onToggleDone={(done) => saveMeal(meal, selectedOptionFor(meal), done)}
                onSelectOption={(optionId) => selectOption(meal, optionId)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-surface-alt px-4 py-5 text-center text-text-muted">
            Nenhuma refeição cadastrada neste ciclo.
          </p>
        )}
      </section>
    </div>
  );
}
