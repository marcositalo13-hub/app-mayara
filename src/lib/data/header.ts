import "server-only";

import { getCurrentMember } from "@/lib/auth";
import { formatLongDate, todayInSaoPaulo } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { CycleWeekRow } from "@/lib/types/db";

export type HeaderData = {
  displayName: string;
  isAdmin: boolean;
  /** e.g. "terça-feira, 13 de outubro" */
  dateLabel: string;
  /** e.g. "Semana 1 de 4"; null outside the active cycle. */
  weekLabel: string | null;
};

/** Data for the shared header of the authenticated pages. */
export async function getHeaderData(): Promise<HeaderData> {
  const member = await getCurrentMember({ required: true });
  const today = todayInSaoPaulo();
  const supabase = await createClient();

  const { data } = await supabase
    .from("plan_cycles")
    .select("cycle_weeks ( week_no, starts_on, ends_on )")
    .eq("is_active", true)
    .maybeSingle();

  // The header never fails the page: without a week it just omits the line.
  const weeks = ((data as { cycle_weeks: Pick<CycleWeekRow, "week_no" | "starts_on" | "ends_on">[] } | null)
    ?.cycle_weeks ?? []);
  const week = weeks.find((w) => w.starts_on <= today && today <= w.ends_on);

  return {
    displayName: member.displayName,
    isAdmin: member.role === "admin",
    dateLabel: formatLongDate(today),
    weekLabel: week ? `Semana ${week.week_no} de ${weeks.length}` : null,
  };
}
