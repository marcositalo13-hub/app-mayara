import "server-only";

import { getCurrentMember } from "@/lib/auth";
import { addDays, todayInSaoPaulo } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { CycleWeekRow, WaterLogRow } from "@/lib/types/db";

export type WaterDay = {
  date: string;
  /** null when nothing was logged that day. */
  ml: number | null;
  /** That day's week target; null when no plan week covers the date. */
  targetMl: number | null;
  isToday: boolean;
};

export type WaterData =
  | { status: "ok"; today: string; goalMl: number; waterMl: number; days: WaterDay[] }
  | { status: "no_active_week"; today: string };

const HISTORY_DAYS = 7;

type WeekPick = Pick<CycleWeekRow, "starts_on" | "ends_on" | "water_ml_target"> & {
  plan_cycles: { is_active: boolean } | { is_active: boolean }[] | null;
};

const isActive = (w: WeekPick) =>
  Array.isArray(w.plan_cycles) ? !!w.plan_cycles[0]?.is_active : !!w.plan_cycles?.is_active;

export async function getWaterData(): Promise<WaterData> {
  const member = await getCurrentMember({ required: true });
  const today = todayInSaoPaulo();
  const start = addDays(today, -(HISTORY_DAYS - 1));
  const supabase = await createClient();

  const [weeksRes, logsRes] = await Promise.all([
    // Every plan week overlapping the last 7 days (any cycle), for each day's own target.
    supabase
      .from("cycle_weeks")
      .select("starts_on, ends_on, water_ml_target, plan_cycles ( is_active )")
      .lte("starts_on", today)
      .gte("ends_on", start),
    // Explicit user filter: an admin's RLS can read every user's logs.
    supabase
      .from("water_logs")
      .select("log_date, ml")
      .eq("user_id", member.userId)
      .gte("log_date", start)
      .lte("log_date", today),
  ]);
  if (weeksRes.error || logsRes.error) throw new Error("Falha ao carregar a água.");

  const weeks = (weeksRes.data ?? []) as unknown as WeekPick[];
  const logs = new Map(
    ((logsRes.data ?? []) as Pick<WaterLogRow, "log_date" | "ml">[]).map((l) => [l.log_date, l.ml]),
  );

  // Prefer the active cycle's week when cycles overlap.
  const weekFor = (date: string) => {
    const covering = weeks.filter((w) => w.starts_on <= date && date <= w.ends_on);
    return covering.find(isActive) ?? covering[0] ?? null;
  };

  const current = weeks.find((w) => isActive(w) && w.starts_on <= today && today <= w.ends_on);
  if (!current) return { status: "no_active_week", today };

  const days: WaterDay[] = Array.from({ length: HISTORY_DAYS }, (_, i) => {
    const date = addDays(start, i);
    return {
      date,
      ml: logs.get(date) ?? null,
      targetMl: weekFor(date)?.water_ml_target ?? null,
      isToday: date === today,
    };
  });

  return {
    status: "ok",
    today,
    goalMl: current.water_ml_target,
    waterMl: logs.get(today) ?? 0,
    days,
  };
}
