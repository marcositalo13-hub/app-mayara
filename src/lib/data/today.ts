import "server-only";

import { getCurrentMember } from "@/lib/auth";
import { todayInSaoPaulo } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type {
  CycleWeekRow,
  MealLogRow,
  MealOptionItemRow,
  MealOptionRow,
  MealRow,
  PlanCycleRow,
  SwapGroupRow,
  SwapItemRow,
} from "@/lib/types/db";
import type { TodayData } from "./today-types";

// One nested select for all plan content of the active cycle.
const CYCLE_SELECT = `
  id, name, starts_on, ends_on, kcal_target,
  cycle_weeks ( week_no, starts_on, ends_on, water_ml_target ),
  meals ( id, sort, name, time_hint, note,
    meal_options ( id, sort, label, kcal, protein_g, carbs_g, fat_g, max_per_week, note,
      meal_option_items ( id, sort, food, quantity ) ) ),
  swap_groups ( id, sort, name, base_portion,
    swap_items ( id, sort, food, portion ) )
`;

type CycleQueryRow = Pick<PlanCycleRow, "id" | "name" | "starts_on" | "ends_on" | "kcal_target"> & {
  cycle_weeks: Pick<CycleWeekRow, "week_no" | "starts_on" | "ends_on" | "water_ml_target">[];
  meals: (Pick<MealRow, "id" | "sort" | "name" | "time_hint" | "note"> & {
    meal_options: (Omit<MealOptionRow, "meal_id" | "created_at"> & {
      meal_option_items: Pick<MealOptionItemRow, "id" | "sort" | "food" | "quantity">[];
    })[];
  })[];
  swap_groups: (Pick<SwapGroupRow, "id" | "sort" | "name" | "base_portion"> & {
    swap_items: Pick<SwapItemRow, "id" | "sort" | "food" | "portion">[];
  })[];
};

const bySort = (a: { sort: number }, b: { sort: number }) => a.sort - b.sort;

// Meals in time order ("HH:MM:SS" compares as text); no time goes last; sort breaks ties.
const byTimeThenSort = (
  a: { sort: number; time_hint: string | null },
  b: { sort: number; time_hint: string | null },
) => {
  if (a.time_hint !== b.time_hint) {
    if (a.time_hint === null) return 1;
    if (b.time_hint === null) return -1;
    return a.time_hint < b.time_hint ? -1 : 1;
  }
  return a.sort - b.sort;
};

export async function getTodayData(): Promise<TodayData> {
  // Reads cookies first: everything below is request-time, never prerendered.
  const member = await getCurrentMember({ required: true });
  const today = todayInSaoPaulo();
  const supabase = await createClient();
  const who = { displayName: member.displayName, role: member.role };

  const [cycleRes, logsRes, waterRes] = await Promise.all([
    supabase.from("plan_cycles").select(CYCLE_SELECT).eq("is_active", true).maybeSingle(),
    // Explicit user filter: an admin's RLS can read every user's logs.
    supabase
      .from("meal_logs")
      .select("meal_id, option_id")
      .eq("user_id", member.userId)
      .eq("log_date", today),
    supabase
      .from("water_logs")
      .select("ml")
      .eq("user_id", member.userId)
      .eq("log_date", today)
      .maybeSingle(),
  ]);

  if (cycleRes.error || logsRes.error || waterRes.error) {
    throw new Error("Falha ao carregar os dados do dia.");
  }

  const cycle = cycleRes.data as CycleQueryRow | null;

  if (!cycle) {
    const { data: last, error } = await supabase
      .from("plan_cycles")
      .select("ends_on")
      .lt("ends_on", today)
      .order("ends_on", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error("Falha ao carregar os dados do dia.");
    return {
      status: "no_active_week",
      today,
      member: who,
      lastCycleEnd: (last as { ends_on: string } | null)?.ends_on ?? null,
      startsOn: null,
    };
  }

  const weeks = cycle.cycle_weeks ?? [];
  // ISO dates compare correctly as strings.
  const week = weeks.find((w) => w.starts_on <= today && today <= w.ends_on);

  if (!week) {
    return {
      status: "no_active_week",
      today,
      member: who,
      lastCycleEnd: today > cycle.ends_on ? cycle.ends_on : null,
      startsOn: today < cycle.starts_on ? cycle.starts_on : null,
    };
  }

  const meals = (cycle.meals ?? [])
    .slice()
    .sort(byTimeThenSort)
    .map((m) => ({
      id: m.id,
      name: m.name,
      time_hint: m.time_hint,
      note: m.note,
      options: (m.meal_options ?? [])
        .slice()
        .sort(bySort)
        .map((o) => ({
          id: o.id,
          label: o.label,
          kcal: o.kcal,
          protein_g: o.protein_g,
          carbs_g: o.carbs_g,
          fat_g: o.fat_g,
          max_per_week: o.max_per_week,
          note: o.note,
          items: (o.meal_option_items ?? [])
            .slice()
            .sort(bySort)
            .map((i) => ({ id: i.id, food: i.food, quantity: i.quantity })),
        })),
    }))
    // A meal with no options cannot be marked done; leave it out entirely.
    .filter((m) => m.options.length > 0);

  return {
    status: "ok",
    today,
    member: who,
    cycle: { id: cycle.id, name: cycle.name, kcal_target: cycle.kcal_target },
    week: {
      week_no: week.week_no,
      total_weeks: weeks.length,
      water_ml_target: week.water_ml_target,
    },
    meals,
    mealLogs: ((logsRes.data ?? []) as Pick<MealLogRow, "meal_id" | "option_id">[]).map((l) => ({
      meal_id: l.meal_id,
      option_id: l.option_id,
    })),
    waterMl: (waterRes.data as { ml: number } | null)?.ml ?? 0,
    swapGroups: (cycle.swap_groups ?? [])
      .slice()
      .sort(bySort)
      .map((g) => ({
        id: g.id,
        name: g.name,
        base_portion: g.base_portion,
        items: (g.swap_items ?? []).slice().sort(bySort),
      })),
  };
}
