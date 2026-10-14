// Dev-only: goals scenarios built through the real pure pipeline (planGoals + buildGoalsData).
import { buildGoalsData, type CycleRow, type GoalsRaw, planGoals } from "@/lib/data/goals-build";
import type { GoalsData } from "@/lib/data/goals-types";
import { addDays } from "@/lib/date";

const MEALS = [
  { id: "m1", name: "Café da manhã", sort: 1, time_hint: "09:00:00" },
  { id: "m2", name: "Almoço", sort: 2, time_hint: "12:30:00" },
  { id: "m3", name: "Lanche da tarde", sort: 3, time_hint: "15:30:00" },
  { id: "m4", name: "Pré-treino", sort: 4, time_hint: "18:00:00" },
  { id: "m5", name: "Jantar", sort: 5, time_hint: "21:00:00" },
].map((m) => ({ ...m, meal_options: [{ count: 1 }] }));

const CYCLE: CycleRow = {
  id: "c1",
  starts_on: "2026-10-13",
  ends_on: "2026-11-09",
  is_active: true,
  cycle_weeks: [
    { week_no: 1, starts_on: "2026-10-13", ends_on: "2026-10-19", cardio_minutes: 60, cardio_sessions: 3, water_ml_target: 1500 },
    { week_no: 2, starts_on: "2026-10-20", ends_on: "2026-10-26", cardio_minutes: 75, cardio_sessions: 3, water_ml_target: 2000 },
    { week_no: 3, starts_on: "2026-10-27", ends_on: "2026-11-02", cardio_minutes: 90, cardio_sessions: 3, water_ml_target: 2500 },
    { week_no: 4, starts_on: "2026-11-03", ends_on: "2026-11-09", cardio_minutes: 105, cardio_sessions: 3, water_ml_target: 2500 },
  ],
  meals: MEALS,
};

const targetOn = (date: string) =>
  CYCLE.cycle_weeks.find((w) => w.starts_on <= date && date <= w.ends_on)?.water_ml_target ?? 2500;

type DayPlan = { meals: number; water: number; skip?: string[] };

/** Builds raw rows from a per-day plan ("meals" = how many of the 5 were followed). */
function rawFrom(days: Record<string, DayPlan>, extra: Partial<GoalsRaw> = {}): GoalsRaw {
  const raw: GoalsRaw = { mealLogs: [], waterLogs: [], sessions: [], cardioLogs: [], weights: [], ...extra };
  for (const [date, d] of Object.entries(days)) {
    MEALS.forEach((m, i) => {
      if (d.skip?.includes(m.name)) return;
      if (i < d.meals) raw.mealLogs.push({ log_date: date, meal_id: m.id, followed: true });
    });
    if (d.water > 0) raw.waterLogs.push({ log_date: date, ml: d.water });
  }
  return raw;
}

const session = (date: string, code = "A") => ({
  performed_on: date,
  finished_at: `${date}T21:00:00Z`,
  workouts: { code, name: "Inferiores — glúteo e posterior" },
});

function build(today: string, raw: GoalsRaw, month?: string): GoalsData {
  return buildGoalsData(planGoals(today, [CYCLE], month), [CYCLE], raw);
}

function range(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export const GOALS_SCENARIOS = ["normal", "andamento", "primeiro-dia", "sem-registro", "perfeito", "semana-completa"] as const;

export function goalsFixture(name: string, month?: string): GoalsData {
  switch (name) {
    case "primeiro-dia":
      return build("2026-10-13", rawFrom({}), month);

    case "sem-registro":
      return build("2026-10-24", rawFrom({}), month);

    case "perfeito": {
      const today = "2026-11-09";
      const days = Object.fromEntries(range("2026-10-13", today).map((d) => [d, { meals: 5, water: targetOn(d) }]));
      const sessions = range("2026-10-13", today)
        .filter((_, i) => i % 7 === 0 || i % 7 === 2 || i % 7 === 4 || i % 7 === 5)
        .map((d, i) => session(d, "ABCD"[i % 4]));
      const cardioLogs = range("2026-11-03", today)
        .filter((_, i) => i % 2 === 0)
        .map((d) => ({ performed_on: d, minutes: 35 }));
      const weights = [
        { measured_on: "2026-10-28", weight_kg: 72.9 },
        { measured_on: "2026-10-31", weight_kg: 72.7 },
        { measured_on: "2026-11-04", weight_kg: 72.3 },
        { measured_on: "2026-11-07", weight_kg: 72.1 },
      ];
      return build(today, rawFrom(days, { sessions, cardioLogs, weights }), month);
    }

    case "semana-completa": {
      const today = "2026-10-26"; // last day of week 2, everything done
      const days = Object.fromEntries(range("2026-10-20", today).map((d) => [d, { meals: 5, water: targetOn(d) }]));
      const sessions = ["2026-10-20", "2026-10-22", "2026-10-24", "2026-10-25"].map((d, i) => session(d, "ABCD"[i]));
      return build(today, rawFrom(days, { sessions, cardioLogs: [{ performed_on: "2026-10-23", minutes: 80 }] }), month);
    }

    case "andamento": {
      const today = "2026-10-21";
      return build(
        today,
        rawFrom({
          "2026-10-17": { meals: 5, water: 1500 },
          "2026-10-18": { meals: 5, water: 1500 },
          "2026-10-19": { meals: 5, water: 1500 },
          "2026-10-20": { meals: 5, water: 2000 },
          [today]: { meals: 2, water: 750 },
        }, { sessions: [session("2026-10-20")] }),
        month,
      );
    }

    default: {
      // normal: a realistic mix, mid week 2.
      const today = "2026-10-23";
      return build(
        today,
        rawFrom(
          {
            "2026-10-13": { meals: 5, water: 1500 },
            "2026-10-14": { meals: 4, water: 1250 },
            "2026-10-15": { meals: 3, water: 500 },
            "2026-10-17": { meals: 4, water: 750, skip: ["Lanche da tarde"] },
            "2026-10-18": { meals: 5, water: 1000, skip: ["Lanche da tarde"] },
            "2026-10-19": { meals: 5, water: 1500 },
            "2026-10-20": { meals: 4, water: 1000, skip: ["Lanche da tarde"] },
            "2026-10-21": { meals: 5, water: 1250 },
            "2026-10-22": { meals: 3, water: 1500 },
            [today]: { meals: 1, water: 500 },
          },
          {
            sessions: [session("2026-10-20"), session("2026-10-22", "B")],
            cardioLogs: [{ performed_on: "2026-10-21", minutes: 25 }],
            weights: [
              { measured_on: "2026-10-14", weight_kg: 73.1 },
              { measured_on: "2026-10-21", weight_kg: 72.6 },
            ],
          },
        ),
        month,
      );
    }
  }
}
