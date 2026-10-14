import { addDays, daysBetween } from "@/lib/date";
import {
  type CardioInput,
  DAY_STATUSES,
  type DayRecord,
  type DayStatus,
  type SessionInput,
  type WeekInfo,
  type WeekSummary,
  type WeightPoint,
} from "./types";

export const WORKOUTS_PER_WEEK = 4;

const inRange = (date: string, from: string, to: string) => from <= date && date <= to;

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}

/** Summary of one cycle week. `today` decides how many days are still left. */
export function weekSummary(
  week: WeekInfo,
  days: DayRecord[],
  sessions: SessionInput[],
  cardio: CardioInput[],
  weights: WeightPoint[],
  today: string,
): WeekSummary {
  const weekDays = days.filter((d) => inRange(d.date, week.startsOn, week.endsOn));

  const daysByStatus = Object.fromEntries(DAY_STATUSES.map((s) => [s, 0])) as Record<DayStatus, number>;
  for (const d of weekDays) daysByStatus[d.status] += 1;

  const prevStart = addDays(week.startsOn, -7);
  const prevEnd = addDays(week.startsOn, -1);

  return {
    daysByStatus,
    goodDays: daysByStatus.bom,
    workoutsDone: sessions.filter(
      (s) => s.finishedAt !== null && inRange(s.performedOn, week.startsOn, week.endsOn),
    ).length,
    workoutsTarget: WORKOUTS_PER_WEEK,
    cardioMinutes: cardio
      .filter((c) => inRange(c.performedOn, week.startsOn, week.endsOn))
      .reduce((sum, c) => sum + c.minutes, 0),
    cardioTarget: week.cardioMinutesTarget,
    waterDaysOnTarget: weekDays.filter((d) => d.waterTarget !== null && d.waterMl >= d.waterTarget).length,
    weightAvg: average(weights.filter((w) => inRange(w.date, week.startsOn, week.endsOn)).map((w) => w.weightKg)),
    weightAvgPrevWeek: average(weights.filter((w) => inRange(w.date, prevStart, prevEnd)).map((w) => w.weightKg)),
    remainingDays:
      today > week.endsOn ? 0 : daysBetween(today < week.startsOn ? week.startsOn : today, week.endsOn) + 1,
  };
}
