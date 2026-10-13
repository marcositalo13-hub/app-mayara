import type { CardioWeek } from "@/lib/data/workout-types";

/** "{logged} de {target} min" + a bar (scaleX, so it never triggers layout). */
export function CardioProgress({ week }: { week: CardioWeek }) {
  const ratio = week.targetMinutes > 0 ? Math.min(1, week.loggedMinutes / week.targetMinutes) : 1;
  const range = week.rpeMax !== week.rpeMin ? `${week.rpeMin}–${week.rpeMax}` : `${week.rpeMin}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="font-extrabold tabular-nums">
          {week.loggedMinutes} de {week.targetMinutes} min
        </p>
        <p className="text-text-muted">PSE {range}</p>
      </div>
      <div
        role="progressbar"
        aria-label="Cardio da semana"
        aria-valuemin={0}
        aria-valuemax={week.targetMinutes}
        aria-valuenow={Math.min(week.loggedMinutes, week.targetMinutes)}
        className="h-2.5 overflow-hidden rounded-full bg-surface-alt"
      >
        <div
          className="h-full origin-left rounded-full bg-accent transition-transform duration-300 ease-(--ease-out)"
          style={{ transform: `scaleX(${ratio})` }}
        />
      </div>
      <p className="text-text-muted tabular-nums">
        {week.loggedSessions} de {week.targetSessions}{" "}
        {week.targetSessions === 1 ? "sessão" : "sessões"}
      </p>
    </div>
  );
}
