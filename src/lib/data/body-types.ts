// Shapes for the Metas > Corpo section. Client-safe (types only).

export type BodyPoint = {
  date: string;
  weightKg: number | null;
  waistCm: number | null;
};

export type WeeklyPoint = {
  /** Monday of the ISO week ('YYYY-MM-DD'). */
  weekStart: string;
  avgWeightKg: number | null;
  avgWaistCm: number | null;
  entries: number;
};

export type LatestValue = { value: number; date: string };

export type BodyData = {
  today: string;
  latestWeight: LatestValue | null;
  latestWaist: LatestValue | null;
  /** Daily entries of the last 90 days, oldest first. */
  daily: BodyPoint[];
  /** Weekly averages of the last 90 days, oldest first (for the charts). */
  weekly: WeeklyPoint[];
  /** Weeks (all time) that have a weight / waist average. */
  weightWeeks: number;
  waistWeeks: number;
  /** Latest weekly average − first weekly average; null until 2 weeks of data. */
  changeSinceStartKg: number | null;
  changeSinceStartCm: number | null;
  /** null = never measured. */
  daysSinceLastWaist: number | null;
};

export type SaveMeasurementInput = {
  measuredOn: string;
  weightKg?: number | null;
  waistCm?: number | null;
};

export type MeasurementResult = { ok: true } | { ok: false; message: string };
