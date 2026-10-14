import { addDays } from "@/lib/date";
import type { DayStatus } from "./types";

/**
 * Consecutive 'bom' days ending yesterday, or ending today when today is already 'bom'.
 * Any other status (including 'sem_registro' or a missing day) breaks the streak.
 */
export function streak(statuses: Record<string, DayStatus>, today: string): number {
  let day = statuses[today] === "bom" ? today : addDays(today, -1);
  let count = 0;
  while (statuses[day] === "bom") {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}
