import "server-only";

import { getCurrentMember } from "@/lib/auth";
import { addDays, daysBetween, todayInSaoPaulo } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { BodyData, BodyPoint, LatestValue, WeeklyPoint } from "./body-types";

const HISTORY_DAYS = 90;
const LOAD_ERROR = "Falha ao carregar as medidas.";

type DailyRow = { measured_on: string; weight_kg: number | string | null; waist_cm: number | string | null };
type WeeklyRow = {
  week_start: string;
  avg_weight_kg: number | string | null;
  avg_waist_cm: number | string | null;
  entries: number;
};

// PostgREST returns numeric columns as numbers, but be safe about strings.
const num = (v: number | string | null): number | null => (v === null ? null : Number(v));

export async function getBodyData(): Promise<BodyData> {
  const member = await getCurrentMember({ required: true });
  const today = todayInSaoPaulo();
  const start = addDays(today, -(HISTORY_DAYS - 1));
  const supabase = await createClient();

  // Explicit user filters everywhere: an admin's RLS can read every user's rows.
  const [dailyRes, weeklyRes, weightRes, waistRes] = await Promise.all([
    supabase
      .from("body_measurements")
      .select("measured_on, weight_kg, waist_cm")
      .eq("user_id", member.userId)
      .gte("measured_on", start)
      .lte("measured_on", today)
      .order("measured_on", { ascending: true }),
    supabase
      .from("v_weekly_weight")
      .select("week_start, avg_weight_kg, avg_waist_cm, entries")
      .eq("user_id", member.userId)
      .order("week_start", { ascending: true })
      .limit(520),
    supabase
      .from("body_measurements")
      .select("measured_on, weight_kg")
      .eq("user_id", member.userId)
      .not("weight_kg", "is", null)
      .order("measured_on", { ascending: false })
      .limit(1),
    supabase
      .from("body_measurements")
      .select("measured_on, waist_cm")
      .eq("user_id", member.userId)
      .not("waist_cm", "is", null)
      .order("measured_on", { ascending: false })
      .limit(1),
  ]);
  if (dailyRes.error || weeklyRes.error || weightRes.error || waistRes.error) {
    throw new Error(LOAD_ERROR);
  }

  const daily: BodyPoint[] = ((dailyRes.data ?? []) as DailyRow[]).map((r) => ({
    date: r.measured_on,
    weightKg: num(r.weight_kg),
    waistCm: num(r.waist_cm),
  }));

  const allWeeks: WeeklyPoint[] = ((weeklyRes.data ?? []) as WeeklyRow[]).map((r) => ({
    weekStart: r.week_start,
    avgWeightKg: num(r.avg_weight_kg),
    avgWaistCm: num(r.avg_waist_cm),
    entries: r.entries,
  }));

  const weightWeeksList = allWeeks.filter((w) => w.avgWeightKg !== null);
  const waistWeeksList = allWeeks.filter((w) => w.avgWaistCm !== null);

  // Change since the start: latest weekly average − first weekly average (needs 2+ weeks).
  const change = (list: number[]) => (list.length >= 2 ? list[list.length - 1] - list[0] : null);
  const changeSinceStartKg = change(weightWeeksList.map((w) => w.avgWeightKg as number));
  const changeSinceStartCm = change(waistWeeksList.map((w) => w.avgWaistCm as number));

  const wRow = (weightRes.data ?? [])[0] as { measured_on: string; weight_kg: number | string } | undefined;
  const cRow = (waistRes.data ?? [])[0] as { measured_on: string; waist_cm: number | string } | undefined;
  const latestWeight: LatestValue | null = wRow ? { value: Number(wRow.weight_kg), date: wRow.measured_on } : null;
  const latestWaist: LatestValue | null = cRow ? { value: Number(cRow.waist_cm), date: cRow.measured_on } : null;

  return {
    today,
    latestWeight,
    latestWaist,
    daily,
    // Charts only show the last 90 days (a week counts if it ends inside the window).
    weekly: allWeeks.filter((w) => addDays(w.weekStart, 6) >= start),
    weightWeeks: weightWeeksList.length,
    waistWeeks: waistWeeksList.length,
    changeSinceStartKg,
    changeSinceStartCm,
    daysSinceLastWaist: latestWaist ? daysBetween(latestWaist.date, today) : null,
  };
}
