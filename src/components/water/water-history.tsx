import { formatLiters } from "@/components/cute";
import type { WaterDay } from "@/lib/data/water";
import { formatWeekdayNarrow, formatWeekdayShortDate } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * Last 7 days as small bars: each = ml / that day's target (capped at 100%).
 * Days without a log show an empty outlined bar. Fill moves by translateY, so the
 * rounded top keeps its shape at any height.
 */
export function WaterHistory({ days, fallbackGoalMl }: { days: WaterDay[]; fallbackGoalMl: number }) {
  return (
    <ol className="grid grid-cols-7 items-end gap-2">
      {days.map((day) => {
        const target = day.targetMl ?? fallbackGoalMl;
        const ratio = day.ml && target > 0 ? Math.min(1, day.ml / target) : 0;
        const label = `${formatWeekdayShortDate(day.date)}${day.isToday ? " (hoje)" : ""}: ${
          day.ml === null ? "sem registro" : `${formatLiters(day.ml)} L de ${formatLiters(target)} L`
        }`;
        return (
          <li key={day.date} className="flex flex-col items-center gap-1.5">
            <div
              role="img"
              aria-label={label}
              className={cn(
                "relative h-24 w-full max-w-9 overflow-hidden rounded-full",
                // No log: empty outlined bar. Logged: soft track behind the fill.
                day.ml === null ? "bg-transparent ring-1 ring-text-muted/40" : "bg-surface-alt",
                day.isToday && "ring-2 ring-primary/50",
              )}
            >
              <div
                className={cn(
                  "absolute inset-0 rounded-full transition-transform duration-300 ease-(--ease-out)",
                  day.isToday ? "bg-primary" : "bg-accent",
                )}
                style={{ transform: `translateY(${(1 - ratio) * 100}%)` }}
              />
            </div>
            <span
              aria-hidden
              className={cn("tabular-nums", day.isToday ? "font-extrabold text-primary" : "text-text-muted")}
            >
              {formatWeekdayNarrow(day.date)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
