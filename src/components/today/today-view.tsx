"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { CelebrationBurst, CUP_ML, formatLiters, HeartProgress, WaterTracker } from "@/components/cute";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CardioProgress } from "@/components/workout/cardio-progress";
import type { TodayActions, TodayData, TodayMeal } from "@/lib/data/today-types";
import { MealCard } from "./meal-card";
import { SwapsSheet } from "./swaps-sheet";
import { TodayHeader } from "./today-header";

type OkData = Extract<TodayData, { status: "ok" }>;
/** mealId → logged optionId (null when the log has no option). Presence = done. */
type LogMap = Record<string, string | null>;
type LogChange = { mealId: string; optionId: string | null; done: boolean };

const WATER_DEBOUNCE_MS = 600;
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
  dateLabel: string;
  actions: TodayActions;
};

export function TodayView({ data, dateLabel, actions }: TodayViewProps) {
  const goalMl = data.week.water_ml_target;
  const cups = Math.max(1, Math.round(goalMl / CUP_ML));
  const mealIds = data.meals.map((m) => m.id);

  // Confirmed state starts from the server and follows it whenever new props arrive
  // (after revalidation); optimistic layers sit on top while a write is in flight.
  const [synced, setSynced] = useState(data);
  const [confirmedLogs, setConfirmedLogs] = useState(() => toLogMap(data.mealLogs));
  const [confirmedMl, setConfirmedMl] = useState(data.waterMl);
  if (synced !== data) {
    setSynced(data);
    setConfirmedLogs(toLogMap(data.mealLogs));
    setConfirmedMl(data.waterMl);
  }

  const [logs, applyLog] = useOptimistic(confirmedLogs, applyChange);
  const [optimisticMl, setOptimisticMl] = useOptimistic(confirmedMl);
  const [draftMl, setDraftMl] = useState<number | null>(null);
  const waterMl = draftMl ?? optimisticMl;

  const [, startMealTransition] = useTransition();
  const [, startWaterTransition] = useTransition();
  const waterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmedMlRef = useRef(data.waterMl);

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [celebrating, setCelebrating] = useState(false);
  const celebratedThisLoad = useRef(false);

  const pendingMl = useRef<number | null>(null);

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

  function changeWater(filledCups: number) {
    const ml = filledCups * CUP_ML;
    maybeCelebrate(progress, dayProgress(mealIds, logs, ml, goalMl));
    setDraftMl(ml);
    pendingMl.current = ml;
    if (waterTimer.current) clearTimeout(waterTimer.current);
    // Rapid taps collapse into one write with the final value.
    waterTimer.current = setTimeout(() => {
      waterTimer.current = null;
      pendingMl.current = null;
      saveWater(ml);
    }, WATER_DEBOUNCE_MS);
  }

  function saveWater(ml: number) {
    startWaterTransition(async () => {
      setOptimisticMl(ml);
      setDraftMl(null);
      const result = await actions.setWater({ ml });
      if (!result.ok) {
        toast.error(result.message, { id: "save-error" });
        return;
      }
      const before = confirmedMlRef.current;
      confirmedMlRef.current = ml;
      setConfirmedMl(ml);
      if (before < goalMl && ml >= goalMl) toast.success("Meta de água batida");
    });
  }

  const saveWaterRef = useRef<(ml: number) => void>(() => {});
  useEffect(() => {
    saveWaterRef.current = saveWater;
  });
  // A debounced write still waiting when the app is hidden/closed is sent right away.
  useEffect(() => {
    const flush = () => {
      if (waterTimer.current) clearTimeout(waterTimer.current);
      waterTimer.current = null;
      if (pendingMl.current === null) return;
      const ml = pendingMl.current;
      pendingMl.current = null;
      saveWaterRef.current(ml);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <TodayHeader
        displayName={data.member.displayName}
        dateLabel={dateLabel}
        weekLabel={`Semana ${data.week.week_no} de ${data.week.total_weeks}`}
        isAdmin={data.member.role === "admin"}
        signOut={actions.signOut}
      />

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
            <p className="text-text-muted tabular-nums">
              {formatLiters(waterMl)} L de {formatLiters(goalMl)} L de água
            </p>
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

      <section aria-labelledby="water-title">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <h2 id="water-title" className="text-xl">
              Água
            </h2>
            <WaterTracker
              cups={cups}
              filled={Math.min(cups, Math.round(waterMl / CUP_ML))}
              onChange={changeWater}
            />
          </CardContent>
        </Card>
      </section>

      {(data.nextWorkout || data.openSessionId) && (
        <section aria-label="Treino">
          <Card>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Dumbbell aria-hidden className="size-6" />
                </span>
                <div className="flex min-w-0 flex-col">
                  {data.openSessionId ? (
                    <p className="font-extrabold">Você tem um treino em andamento</p>
                  ) : (
                    data.nextWorkout && (
                      <>
                        <p className="font-extrabold [overflow-wrap:anywhere]">
                          Treino da vez: {data.nextWorkout.code} — {data.nextWorkout.name}
                        </p>
                        <p className="text-text-muted">
                          {data.nextWorkout.exercise_count === 1
                            ? "1 exercício"
                            : `${data.nextWorkout.exercise_count} exercícios`}
                        </p>
                      </>
                    )
                  )}
                </div>
              </div>
              <Link
                href={data.openSessionId ? `/treino/${data.openSessionId}` : "/treino"}
                className={buttonVariants({ className: "w-full" })}
              >
                {data.openSessionId ? "Continuar treino" : "Começar treino"}
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      {data.cardio && (
        <section aria-labelledby="cardio-title">
          <Link
            href="/treino"
            className="pressable block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card>
              <CardContent className="flex flex-col gap-3">
                <h2 id="cardio-title" className="text-xl">
                  Cardio da semana
                </h2>
                <CardioProgress week={data.cardio} />
              </CardContent>
            </Card>
          </Link>
        </section>
      )}
    </div>
  );
}
