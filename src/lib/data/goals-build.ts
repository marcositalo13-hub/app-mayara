// Pure assembly of the goals data from raw rows (no I/O): shared by the server loader and the
// dev preview, so both exercise exactly the same mapping. The metrics themselves live in
// @/lib/metrics; this file only maps rows to their inputs.
import { addDays, daysBetween } from "@/lib/date";
import {
  buildDayRecord,
  type CardioInput,
  type DayInput,
  type DayRecord,
  type DayStatus,
  daysInMonth,
  feedback,
  monthCalendar,
  monthKey,
  type SessionInput,
  shiftMonth,
  streak,
  type WeekInfo,
  weekSummary,
  type WeightPoint,
} from "@/lib/metrics";
import type { GoalsData } from "./goals-types";

/** How far back the calendar can go (current month + 2 previous). */
export const MONTHS_BACK = 2;
/** History loaded for the streak and the rule window (the streak is capped by it). */
export const HISTORY_DAYS = 60;

export type CycleRow = {
  id: string;
  starts_on: string;
  ends_on: string;
  is_active: boolean;
  cycle_weeks: {
    week_no: number;
    starts_on: string;
    ends_on: string;
    cardio_minutes: number;
    cardio_sessions: number;
    water_ml_target: number;
  }[];
  meals: {
    id: string;
    name: string;
    sort: number;
    time_hint: string | null;
    meal_options: { count: number }[];
  }[];
};

export type SessionRow = {
  performed_on: string;
  finished_at: string | null;
  workouts: { code: string; name: string } | { code: string; name: string }[] | null;
};

export type GoalsRaw = {
  mealLogs: { log_date: string; meal_id: string; followed: boolean }[];
  waterLogs: { log_date: string; ml: number }[];
  sessions: SessionRow[];
  cardioLogs: { performed_on: string; minutes: number }[];
  weights: { measured_on: string; weight_kg: number | string }[];
};

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Meals in the same order as the Dieta tab: by time, then sort; meals without options are left out. */
function planMeals(cycle: CycleRow) {
  return cycle.meals
    .filter((m) => (m.meal_options?.[0]?.count ?? 0) > 0)
    .sort((a, b) => {
      if (a.time_hint !== b.time_hint) {
        if (a.time_hint === null) return 1;
        if (b.time_hint === null) return -1;
        return a.time_hint < b.time_hint ? -1 : 1;
      }
      return a.sort - b.sort;
    });
}

/** Water target of a date: the cycle week containing it, else the nearest week of that cycle. */
function waterTargetFor(cycle: CycleRow, date: string): number | null {
  const weeks = cycle.cycle_weeks ?? [];
  const exact = weeks.find((w) => w.starts_on <= date && date <= w.ends_on);
  if (exact) return exact.water_ml_target;
  let best: { distance: number; target: number } | null = null;
  for (const w of weeks) {
    const distance = date < w.starts_on ? daysBetween(date, w.starts_on) : daysBetween(w.ends_on, date);
    if (!best || distance < best.distance) best = { distance, target: w.water_ml_target };
  }
  return best?.target ?? null;
}

export type GoalsPlan = {
  today: string;
  sel: { year: number; month: number };
  minIndex: number;
  monthStart: string;
  monthEnd: string;
  weekInfo: WeekInfo | null;
  /** First date whose logs must be loaded. */
  rangeStart: string;
};

/** Decides the month shown, the navigation bounds and the date range to load. */
export function planGoals(today: string, cycles: CycleRow[], requestedMonth?: string): GoalsPlan {
  const [ty, tm] = today.split("-").map(Number);

  // Month navigation bounds: never before the first cycle, never more than MONTHS_BACK back.
  const oldest = shiftMonth(ty, tm, -MONTHS_BACK);
  const firstCycle = cycles[0]?.starts_on;
  const firstCycleMonth = firstCycle
    ? { year: Number(firstCycle.slice(0, 4)), month: Number(firstCycle.slice(5, 7)) }
    : { year: ty, month: tm };
  const minMonth =
    firstCycleMonth.year * 12 + firstCycleMonth.month > oldest.year * 12 + oldest.month ? firstCycleMonth : oldest;
  const minIndex = Math.min(minMonth.year * 12 + minMonth.month, ty * 12 + tm);

  let sel = { year: ty, month: tm };
  const m = requestedMonth ? MONTH_RE.exec(requestedMonth) : null;
  if (m) {
    const idx = Number(m[1]) * 12 + Number(m[2]);
    if (idx >= minIndex && idx <= ty * 12 + tm) sel = { year: Number(m[1]), month: Number(m[2]) };
  }
  const monthStart = `${monthKey(sel.year, sel.month)}-01`;
  const monthEnd = addDays(monthStart, daysInMonth(sel.year, sel.month) - 1);

  // Current cycle week (of the active cycle).
  const active = cycles.find((c) => c.is_active && c.starts_on <= today && today <= c.ends_on) ?? null;
  const w = active?.cycle_weeks.find((x) => x.starts_on <= today && today <= x.ends_on) ?? null;
  const weekInfo: WeekInfo | null = w
    ? {
        weekNo: w.week_no,
        startsOn: w.starts_on,
        endsOn: w.ends_on,
        cardioMinutesTarget: w.cardio_minutes,
        cardioSessionsTarget: w.cardio_sessions,
        waterTarget: w.water_ml_target,
      }
    : null;

  // One date range covers the month, the week (+ the week before, for weights) and the history.
  const candidates = [monthStart, addDays(today, -(HISTORY_DAYS - 1))];
  if (weekInfo) candidates.push(addDays(weekInfo.startsOn, -7));
  const rangeStart = candidates.sort()[0];

  return { today, sel, minIndex, monthStart, monthEnd, weekInfo, rangeStart };
}

/** Builds everything the goals section shows, from the plan and the raw rows. */
export function buildGoalsData(plan: GoalsPlan, cycles: CycleRow[], raw: GoalsRaw): GoalsData {
  const { today, sel, minIndex, monthStart, monthEnd, weekInfo, rangeStart } = plan;
  const [ty, tm] = today.split("-").map(Number);

  // ---- map rows ----------------------------------------------------------
  const mealLog = new Map<string, boolean>(); // `${date}|${mealId}` → followed
  for (const r of raw.mealLogs) mealLog.set(`${r.log_date}|${r.meal_id}`, r.followed);
  const water = new Map<string, number>(raw.waterLogs.map((r) => [r.log_date, r.ml]));

  const sessions: SessionInput[] = raw.sessions.map((s) => ({ performedOn: s.performed_on, finishedAt: s.finished_at }));
  const workoutsByDay = new Map<string, { code: string; name: string }[]>();
  for (const s of raw.sessions) {
    if (!s.finished_at) continue;
    const wk = Array.isArray(s.workouts) ? s.workouts[0] : s.workouts;
    if (!wk) continue;
    workoutsByDay.set(s.performed_on, [...(workoutsByDay.get(s.performed_on) ?? []), wk]);
  }

  const cardio: CardioInput[] = raw.cardioLogs.map((c) => ({ performedOn: c.performed_on, minutes: c.minutes }));
  const cardioByDay = new Map<string, number>();
  for (const c of cardio) cardioByDay.set(c.performedOn, (cardioByDay.get(c.performedOn) ?? 0) + c.minutes);

  const weights: WeightPoint[] = raw.weights.map((r) => ({ date: r.measured_on, weightKg: Number(r.weight_kg) }));

  // ---- one DayRecord per date (range start → end of the month or today) --
  const lastDate = monthEnd > today ? monthEnd : today;
  const records: DayRecord[] = [];
  for (let date = rangeStart; date <= lastDate; date = addDays(date, 1)) {
    const cycle = cycles.find((c) => c.starts_on <= date && date <= c.ends_on) ?? null;
    const input: DayInput = {
      date,
      inCycle: cycle !== null,
      meals: cycle
        ? planMeals(cycle).map((meal) => {
            const logged = mealLog.get(`${date}|${meal.id}`);
            return { id: meal.id, name: meal.name, followed: logged === undefined ? null : logged };
          })
        : [],
      waterMl: water.get(date) ?? 0,
      hasWaterLog: water.has(date),
      waterTarget: cycle ? waterTargetFor(cycle, date) : null,
      workouts: workoutsByDay.get(date) ?? [],
      cardioMinutes: cardioByDay.get(date) ?? 0,
    };
    records.push(buildDayRecord(input, today));
  }
  const byDate = new Map(records.map((r) => [r.date, r]));
  const statuses: Record<string, DayStatus> = Object.fromEntries(records.map((r) => [r.date, r.status]));

  // ---- derived values (all from the metrics module) ---------------------
  const week = weekInfo
    ? (() => {
        const days = records.filter((r) => r.date >= weekInfo.startsOn && r.date <= weekInfo.endsOn);
        return { info: weekInfo, days, summary: weekSummary(weekInfo, days, sessions, cardio, weights, today) };
      })()
    : null;

  const currentStreak = streak(statuses, today);
  const closedDays = records.filter((r) => r.date < today && r.inCycle);
  const messages = feedback({
    streak: currentStreak,
    week: week?.summary ?? null,
    closedDays,
    yesterday: byDate.get(addDays(today, -1))?.status ?? null,
  });

  const monthDays: Record<string, DayRecord> = {};
  for (let i = 0; i < daysInMonth(sel.year, sel.month); i++) {
    const date = addDays(monthStart, i);
    const rec = byDate.get(date);
    if (rec) monthDays[date] = rec;
  }

  const selIndex = sel.year * 12 + sel.month;
  const prev = shiftMonth(sel.year, sel.month, -1);
  const next = shiftMonth(sel.year, sel.month, 1);

  return {
    today,
    todayRecord: byDate.get(today) as DayRecord,
    week,
    month: {
      key: monthKey(sel.year, sel.month),
      calendar: monthCalendar(sel.year, sel.month, statuses),
      days: monthDays,
      prevKey: selIndex - 1 >= minIndex ? monthKey(prev.year, prev.month) : null,
      nextKey: selIndex + 1 <= ty * 12 + tm ? monthKey(next.year, next.month) : null,
    },
    streak: currentStreak,
    feedback: messages,
  };
}
