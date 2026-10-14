import { addDays } from "@/lib/date";
import type { CalendarCell, DayStatus, MonthCalendar } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** 'YYYY-MM' helpers for month navigation. */
export const monthKey = (year: number, month: number) => `${year}-${pad(month)}`;

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Calendar grid for a month, weeks starting on Monday. Days missing from `statuses`
 * show as 'sem_registro'.
 */
export function monthCalendar(
  year: number,
  month: number,
  statuses: Record<string, DayStatus>,
): MonthCalendar {
  const first = `${year}-${pad(month)}-01`;
  // getUTCDay: 0 = Sunday … 6 = Saturday → Monday-first column index.
  const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const total = daysInMonth(year, month);

  const cells: (CalendarCell | null)[] = Array.from({ length: lead }, () => null);
  for (let i = 0; i < total; i++) {
    const date = addDays(first, i);
    cells.push({ date, day: i + 1, status: statuses[date] ?? "sem_registro" });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (CalendarCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return { year, month, weeks };
}
