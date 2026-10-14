import type { DayInput, DayRecord, DayStatus, DayStatusInput } from "./types";

/**
 * Status of one day.
 * - future → 'futuro'
 * - outside any plan (no water target or no meals) → 'sem_registro'
 * - no meal/water log → 'em_andamento' today, 'sem_registro' otherwise
 * - every meal followed AND water ≥ target → 'bom'
 * - today (not yet 'bom') → 'em_andamento'
 * - at most one meal missed AND water ≥ 70% of target → 'ok'
 * - otherwise → 'fora'
 */
export function dayStatus(input: DayStatusInput): DayStatus {
  if (input.isFuture) return "futuro";
  if (input.waterTarget === null || input.mealsTotal <= 0) return "sem_registro";
  if (!input.hasAnyLog) return input.isToday ? "em_andamento" : "sem_registro";

  const allMeals = input.mealsFollowed >= input.mealsTotal;
  if (allMeals && input.waterMl >= input.waterTarget) return "bom";
  if (input.isToday) return "em_andamento";

  // 70% compared in integers (×10) so 0.7 × target never loses a millilitre to float rounding.
  const waterOk70 = input.waterMl * 10 >= input.waterTarget * 7;
  if (input.mealsFollowed >= input.mealsTotal - 1 && waterOk70) return "ok";
  return "fora";
}

/** Derives counts and status for one date ('YYYY-MM-DD' strings compare chronologically). */
export function buildDayRecord(input: DayInput, today: string): DayRecord {
  const mealsTotal = input.meals.length;
  const mealsFollowed = input.meals.filter((m) => m.followed === true).length;
  const mealsOffPlan = input.meals.filter((m) => m.followed === false).length;
  const hasAnyLog = input.meals.some((m) => m.followed !== null) || input.hasWaterLog;

  return {
    ...input,
    mealsTotal,
    mealsFollowed,
    mealsOffPlan,
    hasAnyLog,
    status: dayStatus({
      mealsTotal,
      mealsFollowed,
      mealsOffPlan,
      waterMl: input.waterMl,
      waterTarget: input.inCycle ? input.waterTarget : null,
      hasAnyLog,
      isToday: input.date === today,
      isFuture: input.date > today,
    }),
  };
}
