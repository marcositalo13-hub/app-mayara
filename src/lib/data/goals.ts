import "server-only";

import { getCurrentMember } from "@/lib/auth";
import { todayInSaoPaulo } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { buildGoalsData, type CycleRow, type GoalsRaw, planGoals } from "./goals-build";
import type { GoalsData } from "./goals-types";

const LOAD_ERROR = "Falha ao carregar as metas.";

/** Loads the raw rows for the needed date range (minimal queries) and maps them to the metrics. */
export async function getGoalsData(requestedMonth?: string): Promise<GoalsData> {
  // Cookies first: everything below is request-time.
  const member = await getCurrentMember({ required: true });
  const today = todayInSaoPaulo();
  const supabase = await createClient();

  // All cycles are few rows: load them with their weeks and meals once.
  const { data: cycleData, error: cycleError } = await supabase
    .from("plan_cycles")
    .select(
      `id, starts_on, ends_on, is_active,
       cycle_weeks ( week_no, starts_on, ends_on, cardio_minutes, cardio_sessions, water_ml_target ),
       meals ( id, name, sort, time_hint, meal_options ( count ) )`,
    )
    .order("starts_on", { ascending: true });
  if (cycleError) throw new Error(LOAD_ERROR);
  const cycles = (cycleData ?? []) as CycleRow[];

  const plan = planGoals(today, cycles, requestedMonth);
  const { rangeStart } = plan;

  // Explicit user filters everywhere: an admin's RLS can read every user's rows.
  const [mealRes, waterRes, sessionRes, cardioRes, weightRes] = await Promise.all([
    supabase
      .from("meal_logs")
      .select("log_date, meal_id, followed")
      .eq("user_id", member.userId)
      .gte("log_date", rangeStart)
      .lte("log_date", today)
      .limit(1000),
    supabase
      .from("water_logs")
      .select("log_date, ml")
      .eq("user_id", member.userId)
      .gte("log_date", rangeStart)
      .lte("log_date", today),
    supabase
      .from("workout_sessions")
      .select("performed_on, finished_at, workouts ( code, name )")
      .eq("user_id", member.userId)
      .gte("performed_on", rangeStart)
      .lte("performed_on", today),
    supabase
      .from("cardio_logs")
      .select("performed_on, minutes")
      .eq("user_id", member.userId)
      .gte("performed_on", rangeStart)
      .lte("performed_on", today),
    supabase
      .from("body_measurements")
      .select("measured_on, weight_kg")
      .eq("user_id", member.userId)
      .not("weight_kg", "is", null)
      .gte("measured_on", rangeStart)
      .lte("measured_on", today),
  ]);
  if (mealRes.error || waterRes.error || sessionRes.error || cardioRes.error || weightRes.error) {
    throw new Error(LOAD_ERROR);
  }

  const raw: GoalsRaw = {
    mealLogs: (mealRes.data ?? []) as GoalsRaw["mealLogs"],
    waterLogs: (waterRes.data ?? []) as GoalsRaw["waterLogs"],
    sessions: (sessionRes.data ?? []) as unknown as GoalsRaw["sessions"],
    cardioLogs: (cardioRes.data ?? []) as GoalsRaw["cardioLogs"],
    weights: (weightRes.data ?? []) as GoalsRaw["weights"],
  };
  return buildGoalsData(plan, cycles, raw);
}
