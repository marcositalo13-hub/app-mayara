import { describe, expect, it } from "vitest";
import { buildGoalsData, type CycleRow, type GoalsRaw, planGoals } from "./goals-build";

const MEALS = ["Café da manhã", "Almoço", "Lanche da tarde", "Pré-treino", "Jantar"].map((name, i) => ({
  id: `m${i}`,
  name,
  sort: i + 1,
  time_hint: `0${8 + i * 3}:00:00`.slice(-8),
  meal_options: [{ count: 1 }],
}));

const CYCLE: CycleRow = {
  id: "c1",
  starts_on: "2026-10-13",
  ends_on: "2026-11-09",
  is_active: true,
  // A gap on purpose: no week covers 2026-10-20..26 → nearest week's target is used.
  cycle_weeks: [
    { week_no: 1, starts_on: "2026-10-13", ends_on: "2026-10-19", cardio_minutes: 60, cardio_sessions: 3, water_ml_target: 1500 },
    { week_no: 3, starts_on: "2026-10-27", ends_on: "2026-11-02", cardio_minutes: 90, cardio_sessions: 3, water_ml_target: 2500 },
    { week_no: 4, starts_on: "2026-11-03", ends_on: "2026-11-09", cardio_minutes: 105, cardio_sessions: 3, water_ml_target: 2500 },
  ],
  meals: MEALS,
};

const empty: GoalsRaw = { mealLogs: [], waterLogs: [], sessions: [], cardioLogs: [], weights: [] };

describe("buildGoalsData", () => {
  it("days before the cycle are 'sem_registro' without a target; future days are 'futuro'", () => {
    const today = "2026-10-15";
    const data = buildGoalsData(planGoals(today, [CYCLE]), [CYCLE], empty);
    expect(data.month.key).toBe("2026-10");
    expect(data.month.days["2026-10-05"].inCycle).toBe(false);
    expect(data.month.days["2026-10-05"].waterTarget).toBeNull();
    expect(data.month.days["2026-10-05"].status).toBe("sem_registro");
    expect(data.month.days["2026-10-14"].status).toBe("sem_registro"); // in cycle, no logs, past
    expect(data.todayRecord.status).toBe("em_andamento");
    expect(data.month.days["2026-10-20"].status).toBe("futuro");
    expect(data.month.prevKey).toBeNull(); // nothing before the first cycle month
    expect(data.month.nextKey).toBeNull(); // never beyond the current month
  });

  it("water target falls back to the nearest week inside the cycle", () => {
    const today = "2026-10-21"; // inside the gap, closer to week 1 (ends 19) than week 3 (starts 27)
    const data = buildGoalsData(planGoals(today, [CYCLE]), [CYCLE], empty);
    expect(data.todayRecord.waterTarget).toBe(1500);
    expect(data.month.days["2026-10-25"].waterTarget).toBe(2500); // closer to week 3
  });

  it("maps logs to a 'bom' day and counts finished workouts in the week", () => {
    const today = "2026-10-29";
    const raw: GoalsRaw = {
      ...empty,
      mealLogs: MEALS.map((m) => ({ log_date: "2026-10-28", meal_id: m.id, followed: true })),
      waterLogs: [{ log_date: "2026-10-28", ml: 2500 }],
      sessions: [
        { performed_on: "2026-10-28", finished_at: "2026-10-28T21:00:00Z", workouts: { code: "A", name: "Inferiores" } },
        { performed_on: "2026-10-29", finished_at: null, workouts: { code: "B", name: "Superiores" } },
      ],
    };
    const data = buildGoalsData(planGoals(today, [CYCLE]), [CYCLE], raw);
    expect(data.month.days["2026-10-28"].status).toBe("bom");
    expect(data.month.days["2026-10-28"].workouts).toEqual([{ code: "A", name: "Inferiores" }]);
    expect(data.week?.info.weekNo).toBe(3);
    expect(data.week?.summary.workoutsDone).toBe(1);
  });

  it("an invalid or out-of-range month falls back to the current month", () => {
    const data = buildGoalsData(planGoals("2026-10-29", [CYCLE], "2025-01"), [CYCLE], empty);
    expect(data.month.key).toBe("2026-10");
  });
});
