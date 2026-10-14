import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/date";
import {
  buildDayRecord,
  type DayRecord,
  type DayStatus,
  dayStatus,
  feedback,
  type FeedbackContext,
  monthCalendar,
  streak,
  type WeekInfo,
  weekSummary,
} from "./index";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MEALS = ["Café da manhã", "Almoço", "Lanche da tarde", "Pré-treino", "Jantar"];
const TARGET = 2500;

/** One day built through the real pipeline. `followed` = meals followed in plan order. */
function day(
  date: string,
  today: string,
  opts: { followed?: number; offPlan?: string[]; water?: number | null; skip?: string[]; inCycle?: boolean; target?: number } = {},
): DayRecord {
  const followed = opts.followed ?? MEALS.length;
  const meals = MEALS.map((name, i) => ({
    id: `m${i}`,
    name,
    followed: opts.offPlan?.includes(name)
      ? false
      : opts.skip?.includes(name)
        ? null
        : i < followed
          ? true
          : null,
  }));
  return buildDayRecord(
    {
      date,
      inCycle: opts.inCycle ?? true,
      meals,
      waterMl: opts.water ?? 0,
      hasWaterLog: opts.water !== null && opts.water !== undefined,
      waterTarget: opts.inCycle === false ? null : (opts.target ?? TARGET),
      workouts: [],
      cardioMinutes: 0,
    },
    today,
  );
}

const WEEK: WeekInfo = {
  weekNo: 3,
  startsOn: "2026-10-27",
  endsOn: "2026-11-02",
  cardioMinutesTarget: 90,
  cardioSessionsTarget: 3,
  waterTarget: TARGET,
};
const weekDates = Array.from({ length: 7 }, (_, i) => addDays(WEEK.startsOn, i));

const baseInput = {
  mealsTotal: 5,
  mealsFollowed: 5,
  mealsOffPlan: 0,
  waterMl: 2500,
  waterTarget: 2500,
  hasAnyLog: true,
  isToday: false,
  isFuture: false,
};

// ---------------------------------------------------------------------------
// dayStatus
// ---------------------------------------------------------------------------

describe("dayStatus", () => {
  it("perfect day is 'bom'", () => {
    expect(dayStatus(baseInput)).toBe("bom");
  });

  it("day without any log is 'sem_registro' (past) and 'em_andamento' (today)", () => {
    const none = { ...baseInput, mealsFollowed: 0, waterMl: 0, hasAnyLog: false };
    expect(dayStatus(none)).toBe("sem_registro");
    expect(dayStatus({ ...none, isToday: true })).toBe("em_andamento");
  });

  it("today in progress is 'em_andamento' until it is complete, then 'bom'", () => {
    expect(dayStatus({ ...baseInput, isToday: true, mealsFollowed: 2, waterMl: 750 })).toBe("em_andamento");
    expect(dayStatus({ ...baseInput, isToday: true })).toBe("bom");
  });

  it("exactly 70% of the water target still counts for 'ok'", () => {
    expect(dayStatus({ ...baseInput, mealsFollowed: 4, waterMl: 1750 })).toBe("ok");
    expect(dayStatus({ ...baseInput, mealsFollowed: 4, waterMl: 1500, waterTarget: 1500 * 1 })).toBe("ok");
    // 70% of 1500 = 1050 exactly (integer comparison, no float drift)
    expect(dayStatus({ ...baseInput, mealsFollowed: 4, waterMl: 1050, waterTarget: 1500 })).toBe("ok");
    expect(dayStatus({ ...baseInput, mealsFollowed: 4, waterMl: 1049, waterTarget: 1500 })).toBe("fora");
  });

  it("1 meal off with enough water is 'ok'; full water but 1 meal off is never 'bom'", () => {
    expect(dayStatus({ ...baseInput, mealsFollowed: 4 })).toBe("ok");
  });

  it("2 meals off is 'fora' even with all the water", () => {
    expect(dayStatus({ ...baseInput, mealsFollowed: 3 })).toBe("fora");
  });

  it("future and out-of-cycle days", () => {
    expect(dayStatus({ ...baseInput, isFuture: true })).toBe("futuro");
    expect(dayStatus({ ...baseInput, waterTarget: null })).toBe("sem_registro");
  });

  it("buildDayRecord counts followed / off plan / missing logs", () => {
    const d = day("2026-10-28", "2026-10-30", { followed: 3, offPlan: ["Jantar"], water: 2000 });
    expect(d.mealsFollowed).toBe(3);
    expect(d.mealsOffPlan).toBe(1);
    expect(d.hasAnyLog).toBe(true);
    expect(d.status).toBe("fora"); // 3 of 5 followed
  });
});

// ---------------------------------------------------------------------------
// weekSummary
// ---------------------------------------------------------------------------

describe("weekSummary", () => {
  const today = "2026-11-02"; // last day of the week

  it("perfect week", () => {
    const days = weekDates.map((d) => day(d, today, { water: TARGET }));
    const sessions = ["2026-10-27", "2026-10-29", "2026-10-31", "2026-11-01"].map((d) => ({
      performedOn: d,
      finishedAt: `${d}T20:00:00Z`,
    }));
    const cardio = [30, 30, 30].map((minutes, i) => ({ performedOn: weekDates[i * 2], minutes }));
    const s = weekSummary(WEEK, days, sessions, cardio, [], today);
    expect(s.goodDays).toBe(7);
    expect(s.daysByStatus.bom).toBe(7);
    expect(s.workoutsDone).toBe(4);
    expect(s.workoutsTarget).toBe(4);
    expect(s.cardioMinutes).toBe(90);
    expect(s.cardioTarget).toBe(90);
    expect(s.waterDaysOnTarget).toBe(7);
    expect(s.remainingDays).toBe(1);
  });

  it("week with 0 workouts (unfinished sessions and other weeks don't count)", () => {
    const days = weekDates.map((d) => day(d, "2026-10-29", { water: TARGET }));
    const sessions = [
      { performedOn: "2026-10-28", finishedAt: null },
      { performedOn: "2026-10-20", finishedAt: "2026-10-20T20:00:00Z" },
    ];
    const s = weekSummary(WEEK, days, sessions, [], [], "2026-10-29");
    expect(s.workoutsDone).toBe(0);
    expect(s.remainingDays).toBe(5); // 29, 30, 31, 1, 2
  });

  it("weight averages: this week vs the 7 days before", () => {
    const weights = [
      { date: "2026-10-21", weightKg: 73.0 },
      { date: "2026-10-24", weightKg: 72.6 },
      { date: "2026-10-28", weightKg: 72.4 },
      { date: "2026-10-31", weightKg: 72.2 },
    ];
    const s = weekSummary(WEEK, [], [], [], weights, today);
    expect(s.weightAvgPrevWeek).toBe(72.8);
    expect(s.weightAvg).toBe(72.3);
  });
});

// ---------------------------------------------------------------------------
// streak
// ---------------------------------------------------------------------------

describe("streak", () => {
  const map = (entries: [string, DayStatus][]) => Object.fromEntries(entries);

  it("counts 'bom' days ending yesterday when today isn't done", () => {
    const s = map([
      ["2026-10-26", "bom"],
      ["2026-10-27", "bom"],
      ["2026-10-28", "bom"],
      ["2026-10-29", "em_andamento"],
    ]);
    expect(streak(s, "2026-10-29")).toBe(3);
  });

  it("includes today once today is 'bom'", () => {
    const s = map([
      ["2026-10-28", "bom"],
      ["2026-10-29", "bom"],
    ]);
    expect(streak(s, "2026-10-29")).toBe(2);
  });

  it("is broken by a 'sem_registro' day", () => {
    const s = map([
      ["2026-10-25", "bom"],
      ["2026-10-26", "bom"],
      ["2026-10-27", "sem_registro"],
      ["2026-10-28", "bom"],
      ["2026-10-29", "em_andamento"],
    ]);
    expect(streak(s, "2026-10-29")).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// monthCalendar
// ---------------------------------------------------------------------------

describe("monthCalendar", () => {
  it("month spanning two cycle weeks: Monday-first grid, statuses mapped, padding outside", () => {
    // October 2026 starts on a Thursday; cycle weeks 1 (13–19) and 2 (20–26) fall inside it.
    const statuses: Record<string, DayStatus> = {};
    for (let i = 0; i < 7; i++) statuses[addDays("2026-10-13", i)] = "bom"; // week 1
    for (let i = 0; i < 7; i++) statuses[addDays("2026-10-20", i)] = "ok"; // week 2
    const cal = monthCalendar(2026, 10, statuses);

    expect(cal.weeks.every((w) => w.length === 7)).toBe(true);
    expect(cal.weeks[0].slice(0, 3)).toEqual([null, null, null]); // Mon–Wed before the 1st
    expect(cal.weeks[0][3]).toEqual({ date: "2026-10-01", day: 1, status: "sem_registro" }); // before the cycle
    const cells = cal.weeks.flat().filter((c) => c !== null);
    expect(cells).toHaveLength(31);
    expect(cells.find((c) => c.date === "2026-10-13")?.status).toBe("bom");
    expect(cells.find((c) => c.date === "2026-10-19")?.status).toBe("bom");
    expect(cells.find((c) => c.date === "2026-10-20")?.status).toBe("ok");
    expect(cells.find((c) => c.date === "2026-10-27")?.status).toBe("sem_registro");
    // 2026-10-13 is a Tuesday → column index 1
    const row = cal.weeks.find((w) => w.some((c) => c?.date === "2026-10-13"))!;
    expect(row.findIndex((c) => c?.date === "2026-10-13")).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// feedback
// ---------------------------------------------------------------------------

describe("feedback", () => {
  const today = "2026-10-31";
  const closed = (opts: Parameters<typeof day>[2], n = 7) =>
    Array.from({ length: n }, (_, i) => day(addDays(today, -n + i), today, opts));

  const ctx = (over: Partial<FeedbackContext> = {}): FeedbackContext => ({
    streak: 0,
    week: null,
    closedDays: [],
    yesterday: null,
    ...over,
  });

  const week = (over: Partial<ReturnType<typeof weekSummary>> = {}) => ({
    ...weekSummary(WEEK, [], [], [], [], "2026-10-29"),
    ...over,
  });

  it("orders by priority and caps at 3 messages", () => {
    const msgs = feedback(
      ctx({
        streak: 4,
        week: week({ workoutsDone: 4, cardioMinutes: 95, cardioTarget: 90, weightAvg: 72.3, weightAvgPrevWeek: 72.8 }),
        yesterday: "fora",
      }),
    );
    expect(msgs.map((m) => m.id)).toEqual(["streak", "workouts-complete", "cardio-done"]);
    expect(msgs).toHaveLength(3);
    expect(msgs[0].text).toBe("4 dias bons seguidos. É esse ritmo que muda o corpo.");
    expect(msgs[1].text).toBe("Semana de treino completa: 4 de 4!");
    expect(msgs[2].text).toBe("Meta de cardio da semana batida: 95 min.");
  });

  it("remaining workouts nudge (with singular/plural)", () => {
    expect(feedback(ctx({ week: week({ workoutsDone: 1, remainingDays: 4 }) }))[0].text).toBe(
      "Faltam 3 treinos para fechar a semana, e ainda restam 4 dias.",
    );
    expect(feedback(ctx({ week: week({ workoutsDone: 3, remainingDays: 1 }) }))[0].text).toBe(
      "Falta 1 treino para fechar a semana, e ainda resta 1 dia.",
    );
  });

  it("water below target on 3 of the last 4 closed days", () => {
    // 4 closed days in order: one on target, then three below it.
    const days = [-4, -3, -2, -1].map((offset, i) => day(addDays(today, offset), today, { water: i === 0 ? TARGET : 1000 }));
    const msg = feedback(ctx({ closedDays: days }));
    expect(msg.map((m) => m.id)).toContain("water-low");
    expect(msg.find((m) => m.id === "water-low")?.text).toBe(
      "A água ficou abaixo da meta em 3 dos últimos 4 dias. Um copo a cada mamada ajuda.",
    );
  });

  it("days without any log don't count as low water or missed meals", () => {
    const empty = closed({ followed: 0, water: null });
    expect(feedback(ctx({ closedDays: empty }))).toEqual([]);
  });

  it("most-missed meal (≥ 3 times) with the extra line for the afternoon snack", () => {
    const days = closed({ skip: ["Lanche da tarde"], water: TARGET });
    const msg = feedback(ctx({ closedDays: days })).find((m) => m.id === "meal-missed");
    expect(msg?.text).toBe("Lanche da tarde foi a refeição mais pulada da semana. Ele segura a fome da noite.");
    const dinner = feedback(ctx({ closedDays: closed({ skip: ["Jantar"], water: TARGET }) })).find(
      (m) => m.id === "meal-missed",
    );
    expect(dinner?.text).toBe("Jantar foi a refeição mais pulada da semana.");
  });

  it("yesterday off plan, and weight messages", () => {
    expect(feedback(ctx({ yesterday: "fora" }))[0].id).toBe("yesterday-off");
    expect(feedback(ctx({ week: week({ workoutsDone: 4, weightAvg: 72.3, weightAvgPrevWeek: 72.8 }) }))[1].text).toBe(
      "Sua média de peso caiu 0,5 kg em relação à semana passada.",
    );
    expect(
      feedback(ctx({ week: week({ workoutsDone: 4, weightAvg: 73.0, weightAvgPrevWeek: 72.8 }) })).map((m) => m.id),
    ).toContain("weight-up");
    // A difference that rounds to 0,0 says nothing.
    expect(
      feedback(ctx({ week: week({ workoutsDone: 4, weightAvg: 72.81, weightAvgPrevWeek: 72.8 }) })).map((m) => m.id),
    ).toEqual(["workouts-complete"]);
  });

  it("never suggests compensating", () => {
    const all = feedback(
      ctx({
        streak: 5,
        week: week({ workoutsDone: 0, remainingDays: 2, weightAvg: 74, weightAvgPrevWeek: 73 }),
        closedDays: closed({ followed: 2, water: 500 }),
        yesterday: "fora",
      }),
    );
    for (const m of all) expect(m.text).not.toMatch(/pule|coma menos|compens|queim/i);
  });
});
