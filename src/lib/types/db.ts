// Hand-written row types matching supabase/migrations/0001_schema.sql.
// Dates are 'YYYY-MM-DD' strings, `time` is 'HH:MM:SS', timestamptz is ISO;
// numeric columns arrive from PostgREST as JSON numbers.

export type Uuid = string;
export type IsoDate = string;

export type MemberRow = {
  user_id: Uuid;
  role: "user" | "admin";
  display_name: string;
  created_at: string;
};

export type PlanCycleRow = {
  id: Uuid;
  name: string;
  starts_on: IsoDate;
  ends_on: IsoDate;
  kcal_target: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
};

export type CycleWeekRow = {
  id: Uuid;
  cycle_id: Uuid;
  week_no: number;
  starts_on: IsoDate;
  ends_on: IsoDate;
  cardio_minutes: number;
  cardio_sessions: number;
  rpe_min: number;
  rpe_max: number;
  water_ml_target: number;
  created_at: string;
};

export type MealRow = {
  id: Uuid;
  cycle_id: Uuid;
  sort: number;
  name: string;
  time_hint: string | null;
  note: string | null;
  created_at: string;
};

export type MealOptionRow = {
  id: Uuid;
  meal_id: Uuid;
  sort: number;
  label: string;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  max_per_week: number | null;
  note: string | null;
  created_at: string;
};

export type MealOptionItemRow = {
  id: Uuid;
  option_id: Uuid;
  sort: number;
  food: string;
  quantity: string | null;
  created_at: string;
};

export type SwapGroupRow = {
  id: Uuid;
  cycle_id: Uuid;
  sort: number;
  name: string;
  base_portion: string;
  created_at: string;
};

export type SwapItemRow = {
  id: Uuid;
  group_id: Uuid;
  sort: number;
  food: string;
  portion: string;
  created_at: string;
};

export type WorkoutRow = {
  id: Uuid;
  cycle_id: Uuid;
  code: string;
  sort: number;
  name: string;
  created_at: string;
};

export type MealLogRow = {
  id: Uuid;
  user_id: Uuid;
  log_date: IsoDate;
  meal_id: Uuid;
  option_id: Uuid | null;
  followed: boolean;
  created_at: string;
};

export type WaterLogRow = {
  id: Uuid;
  user_id: Uuid;
  log_date: IsoDate;
  ml: number;
  created_at: string;
};

/** v_next_workout has the same columns as workouts. */
export type NextWorkoutViewRow = WorkoutRow;
