import "server-only";

import { connection } from "next/server";
import { formatLongDate, todayInSaoPaulo } from "@/lib/date";
import { getProfile } from "@/lib/data/profile";
import { createClient } from "@/lib/supabase/server";
import type { CycleWeekRow } from "@/lib/types/db";

export type HeaderData = {
  userId: string;
  displayName: string;
  isAdmin: boolean;
  /** Signed URL of the profile photo, or null. */
  avatarUrl: string | null;
  /** e.g. "terça-feira, 13 de outubro" */
  dateLabel: string;
  /** e.g. "Semana 1 de 4"; null outside the active cycle. */
  weekLabel: string | null;
};

/** Data for the shared header of the authenticated pages. */
export async function getHeaderData(): Promise<HeaderData> {
  // Request-time from here on: the date below must never be baked into a prerender.
  await connection();
  const today = todayInSaoPaulo();
  const supabase = await createClient();

  const [profile, cycleRes] = await Promise.all([
    getProfile(),
    supabase
      .from("plan_cycles")
      .select("cycle_weeks ( week_no, starts_on, ends_on )")
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  // The header never fails the page: without a week it just omits the line.
  const weeks = ((cycleRes.data as { cycle_weeks: Pick<CycleWeekRow, "week_no" | "starts_on" | "ends_on">[] } | null)
    ?.cycle_weeks ?? []);
  const week = weeks.find((w) => w.starts_on <= today && today <= w.ends_on);

  return {
    userId: profile.userId,
    displayName: profile.displayName,
    isAdmin: profile.isAdmin,
    avatarUrl: profile.avatarUrl,
    dateLabel: formatLongDate(today),
    weekLabel: week ? `Semana ${week.week_no} de ${weeks.length}` : null,
  };
}
