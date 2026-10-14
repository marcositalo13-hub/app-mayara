// Shared types of the metrics module. Pure data; no I/O anywhere in src/lib/metrics.

export type DayStatus = "bom" | "ok" | "fora" | "sem_registro" | "em_andamento" | "futuro";

export const DAY_STATUSES: readonly DayStatus[] = [
  "bom",
  "ok",
  "fora",
  "sem_registro",
  "em_andamento",
  "futuro",
] as const;

export type DayStatusInput = {
  mealsTotal: number;
  /** meal_logs with followed = true (a plan meal without a log is not followed). */
  mealsFollowed: number;
  /** meal_logs with followed = false. */
  mealsOffPlan: number;
  waterMl: number;
  /** null when the date is outside every plan cycle. */
  waterTarget: number | null;
  /** Any meal or water log that day. */
  hasAnyLog: boolean;
  isToday: boolean;
  isFuture: boolean;
};

export type DayMeal = {
  id: string;
  name: string;
  /** true = logged as followed, false = logged off plan, null = no log. */
  followed: boolean | null;
};

/** Raw facts of one date, already mapped from the database rows. */
export type DayInput = {
  date: string;
  /** The date belongs to a plan cycle. */
  inCycle: boolean;
  /** Plan meals of that date's cycle, in plan order. */
  meals: DayMeal[];
  waterMl: number;
  hasWaterLog: boolean;
  waterTarget: number | null;
  /** Finished workout sessions performed that day. */
  workouts: { code: string; name: string }[];
  cardioMinutes: number;
};

/** One date with every derived value the screens and rules need. */
export type DayRecord = DayInput & {
  mealsTotal: number;
  mealsFollowed: number;
  mealsOffPlan: number;
  hasAnyLog: boolean;
  status: DayStatus;
};

export type WeekInfo = {
  weekNo: number;
  startsOn: string;
  endsOn: string;
  cardioMinutesTarget: number;
  cardioSessionsTarget: number;
  waterTarget: number;
};

export type SessionInput = { performedOn: string; finishedAt: string | null };
export type CardioInput = { performedOn: string; minutes: number };
export type WeightPoint = { date: string; weightKg: number };

export type WeekSummary = {
  daysByStatus: Record<DayStatus, number>;
  goodDays: number;
  workoutsDone: number;
  workoutsTarget: number;
  cardioMinutes: number;
  cardioTarget: number;
  waterDaysOnTarget: number;
  /** Average of the weighings inside the week (2 decimals); null without weighings. */
  weightAvg: number | null;
  /** Average of the 7 days before the week; null without weighings. */
  weightAvgPrevWeek: number | null;
  /** Days left in the week counting today (0 once the week is over). */
  remainingDays: number;
};

export type CalendarCell = { date: string; day: number; status: DayStatus };

export type MonthCalendar = {
  year: number;
  /** 1–12 */
  month: number;
  /** Rows of 7 (Monday → Sunday); null = padding outside the month. */
  weeks: (CalendarCell | null)[][];
};

export type FeedbackTone = "celebrate" | "nudge" | "info";

export type FeedbackMessage = {
  id:
    | "streak"
    | "workouts-complete"
    | "workouts-remaining"
    | "cardio-done"
    | "water-low"
    | "meal-missed"
    | "yesterday-off"
    | "weight-down"
    | "weight-up";
  tone: FeedbackTone;
  text: string;
};

export type FeedbackContext = {
  streak: number;
  /** Current cycle week summary; null outside a cycle. */
  week: WeekSummary | null;
  /** In-cycle days before today, oldest first. */
  closedDays: DayRecord[];
  yesterday: DayStatus | null;
};
