// Shape of the Dieta tab data. Client-safe (types only).

export type TodayMember = {
  displayName: string;
  role: "user" | "admin";
};

export type TodayOptionItem = {
  id: string;
  food: string;
  quantity: string | null;
};

export type TodayOption = {
  id: string;
  label: string;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  max_per_week: number | null;
  note: string | null;
  items: TodayOptionItem[];
};

export type TodayMeal = {
  id: string;
  name: string;
  time_hint: string | null;
  note: string | null;
  /** Ordered by sort; never empty (meals without options are dropped). */
  options: TodayOption[];
};

export type TodayMealLog = {
  meal_id: string;
  option_id: string | null;
};

export type TodaySwapGroup = {
  id: string;
  name: string;
  base_portion: string;
  items: { id: string; food: string; portion: string }[];
};

export type TodayData =
  | {
      status: "ok";
      today: string;
      member: TodayMember;
      cycle: { id: string; name: string; kcal_target: number };
      week: { week_no: number; total_weeks: number; water_ml_target: number };
      meals: TodayMeal[];
      mealLogs: TodayMealLog[];
      waterMl: number;
      swapGroups: TodaySwapGroup[];
    }
  | {
      status: "no_active_week";
      today: string;
      member: TodayMember;
      /** Last day of the most recent cycle that already ended, if any. */
      lastCycleEnd: string | null;
      /** First day of the active cycle when today is before it starts. */
      startsOn: string | null;
    };

export type ActionResult = { ok: true } | { ok: false; message: string };

export type TodayActions = {
  setMealDone: (input: { mealId: string; optionId: string; done: boolean }) => Promise<ActionResult>;
};
