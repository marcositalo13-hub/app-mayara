"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Dumbbell, GlassWater, HeartPulse, Utensils } from "lucide-react";
import { CelebrationBurst, formatLiters } from "@/components/cute";
import type { GoalsData } from "@/lib/data/goals-types";
import { formatWeekdayNarrow } from "@/lib/date";
import type { DayRecord } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { DaySheet } from "./day-sheet";
import { LEGEND, STATUS_CIRCLE, STATUS_LABEL } from "./status";

const kg = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

// ---------------------------------------------------------------------------
// Dia
// ---------------------------------------------------------------------------

export function DayView({ day }: { day: DayRecord }) {
  if (!day.inCycle) {
    return <p className="rounded-md bg-surface-alt px-4 py-5 text-center text-text-muted">Hoje está fora do plano.</p>;
  }
  const workoutDone = day.workouts.length > 0;
  const rows = [
    {
      icon: Utensils,
      label: "Refeições",
      value: `${day.mealsFollowed} de ${day.mealsTotal}`,
      done: day.mealsTotal > 0 && day.mealsFollowed >= day.mealsTotal,
    },
    {
      icon: GlassWater,
      label: "Água",
      value: `${formatLiters(day.waterMl)} L de ${formatLiters(day.waterTarget ?? 0)} L`,
      done: day.waterTarget !== null && day.waterMl >= day.waterTarget,
    },
    {
      icon: Dumbbell,
      label: "Treino",
      value: workoutDone ? `Feito (${day.workouts.map((w) => w.code).join(", ")})` : "Ainda não",
      done: workoutDone,
    },
    {
      icon: HeartPulse,
      label: "Cardio hoje",
      value: `${day.cardioMinutes} min`,
      done: day.cardioMinutes > 0,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <StatusBadge status={day.status} />
      <ul className="flex flex-col divide-y divide-border">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <li key={r.label} className="flex min-h-12 items-center gap-3 py-2">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  r.done ? "bg-primary-soft text-primary" : "bg-surface-alt text-text-muted",
                )}
              >
                {r.done ? <Check aria-hidden className="size-5" /> : <Icon aria-hidden className="size-5" />}
              </span>
              <span className="min-w-0 flex-1 font-bold">{r.label}</span>
              <span className="shrink-0 text-right tabular-nums text-text-muted">{r.value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: DayRecord["status"] }) {
  return (
    <p className="inline-flex w-fit items-center gap-2 rounded-full bg-surface-alt px-3 py-1.5 font-bold">
      <span aria-hidden className={cn("inline-block size-4 rounded-full", STATUS_CIRCLE[status])} />
      {STATUS_LABEL[status]}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Semana
// ---------------------------------------------------------------------------

const CELEBRATED_WEEK_KEY = "mayara:week-celebrated";

export function WeekView({ week, today }: { week: NonNullable<GoalsData["week"]>; today: string }) {
  const { info, days, summary } = week;
  const complete = summary.goodDays === 7;
  const [celebrating, setCelebrating] = useState(false);

  // First render of a fully completed week: one burst per week (storage optional).
  useEffect(() => {
    if (!complete) return;
    const frame = requestAnimationFrame(() => {
      try {
        if (localStorage.getItem(CELEBRATED_WEEK_KEY) === info.startsOn) return;
        localStorage.setItem(CELEBRATED_WEEK_KEY, info.startsOn);
      } catch {}
      setCelebrating(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [complete, info.startsOn]);

  const cardioRatio = summary.cardioTarget > 0 ? Math.min(1, summary.cardioMinutes / summary.cardioTarget) : 0;
  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex flex-col gap-5">
      {/* The cycle week runs in its own order (it may start on any weekday). */}
      <div className="relative">
        <ol className="grid grid-cols-7 gap-1" aria-label={`Semana ${info.weekNo} do ciclo`}>
          {days.map((d) => (
            <li key={d.date} className="flex flex-col items-center gap-1">
              <span
                role="img"
                aria-label={`${d.date === today ? "Hoje: " : ""}${STATUS_LABEL[d.status]}`}
                className={cn(
                  "size-9 rounded-full",
                  STATUS_CIRCLE[d.status],
                  d.date === today && "ring-2 ring-text ring-offset-2 ring-offset-surface",
                )}
              />
              <span className={cn("tabular-nums", d.date === today ? "font-extrabold" : "text-text-muted")}>
                {formatWeekdayNarrow(d.date)}
              </span>
            </li>
          ))}
        </ol>
        {celebrating && <CelebrationBurst onDone={() => setCelebrating(false)} />}
      </div>

      <dl className="grid grid-cols-1 gap-3">
        <Stat label="Dias bons" value={`${summary.goodDays} de 7`} />
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md bg-surface-alt px-4 py-3">
          <dt className="font-bold">Treinos</dt>
          <dd className="flex items-center gap-2">
            <span className="flex gap-1" aria-hidden>
              {Array.from({ length: summary.workoutsTarget }, (_, i) => (
                <Dumbbell
                  key={i}
                  className={cn("size-5", i < summary.workoutsDone ? "text-primary" : "text-text-muted/40")}
                />
              ))}
            </span>
            <span className="tabular-nums">
              {summary.workoutsDone} de {summary.workoutsTarget}
            </span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md bg-surface-alt px-4 py-3">
          <dt className="font-bold">Cardio</dt>
          <dd className="flex items-center gap-3">
            <span className="tabular-nums">
              {summary.cardioMinutes} de {summary.cardioTarget} min
            </span>
            <svg viewBox="0 0 64 64" className="size-12 -rotate-90" aria-hidden>
              <circle cx="32" cy="32" r={R} fill="none" strokeWidth="7" className="stroke-border" />
              <circle
                cx="32"
                cy="32"
                r={R}
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                className="stroke-accent"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - cardioRatio)}
              />
            </svg>
          </dd>
        </div>
        <Stat
          label="Água na meta"
          value={`em ${summary.waterDaysOnTarget} ${plural(summary.waterDaysOnTarget, "dia", "dias")}`}
        />
        {summary.weightAvg !== null && summary.weightAvgPrevWeek !== null && (
          <Stat
            label="Peso médio"
            value={`${kg(summary.weightAvg)} kg (antes: ${kg(summary.weightAvgPrevWeek)} kg)`}
          />
        )}
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 rounded-md bg-surface-alt px-4 py-3">
      <dt className="font-bold">{label}</dt>
      <dd className="tabular-nums [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mês
// ---------------------------------------------------------------------------

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"]; // Monday first
const WEEKDAY_NAMES = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];

function monthTitle(key: string) {
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${key}-15T12:00:00Z`),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function MonthView({
  month,
  today,
  hrefFor,
}: {
  month: GoalsData["month"];
  today: string;
  /** Builds the link for another month (keeps the page's other query params). */
  hrefFor: (key: string) => string;
}) {
  const [openDate, setOpenDate] = useState<string | null>(null);
  const navClass =
    "pressable flex size-12 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        {month.prevKey ? (
          <Link href={hrefFor(month.prevKey)} scroll={false} replace aria-label="Mês anterior" className={cn(navClass, "text-primary")}>
            <ChevronLeft className="size-6" />
          </Link>
        ) : (
          <span aria-hidden className={cn(navClass, "text-text-muted/40")}>
            <ChevronLeft className="size-6" />
          </span>
        )}
        <h3 className="text-lg" aria-live="polite">
          {monthTitle(month.key)}
        </h3>
        {month.nextKey ? (
          <Link href={hrefFor(month.nextKey)} scroll={false} replace aria-label="Próximo mês" className={cn(navClass, "text-primary")}>
            <ChevronRight className="size-6" />
          </Link>
        ) : (
          <span aria-hidden className={cn(navClass, "text-text-muted/40")}>
            <ChevronRight className="size-6" />
          </span>
        )}
      </div>

      <div role="grid" aria-label={monthTitle(month.key)} className="flex flex-col gap-1">
        <div role="row" className="grid grid-cols-7">
          {WEEKDAYS.map((w, i) => (
            <span key={i} role="columnheader" aria-label={WEEKDAY_NAMES[i]} className="text-center text-text-muted">
              {w}
            </span>
          ))}
        </div>
        {month.calendar.weeks.map((week, wi) => (
          <div key={wi} role="row" className="grid grid-cols-7">
            {week.map((cell, ci) => {
              if (!cell) return <span key={ci} role="gridcell" aria-hidden />;
              const isToday = cell.date === today;
              const future = cell.status === "futuro";
              return (
                <span key={cell.date} role="gridcell" className="flex justify-center">
                  <button
                    type="button"
                    disabled={future}
                    onClick={() => setOpenDate(cell.date)}
                    aria-label={`${cell.day}: ${STATUS_LABEL[cell.status]}${isToday ? " (hoje)" : ""}`}
                    className="pressable flex aspect-square w-full max-w-12 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
                  >
                    <span
                      className={cn(
                        "flex size-[min(2.25rem,100%)] items-center justify-center rounded-full font-bold tabular-nums",
                        STATUS_CIRCLE[cell.status],
                        isToday && "ring-2 ring-text ring-offset-2 ring-offset-surface",
                      )}
                    >
                      {cell.day}
                    </span>
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legenda">
        {LEGEND.map((l) => (
          <li key={l.status} className="flex items-center gap-2 text-text-muted">
            <span aria-hidden className={cn("inline-block size-4 rounded-full", STATUS_CIRCLE[l.status])} />
            {l.label}
          </li>
        ))}
        <li className="flex items-center gap-2 text-text-muted">
          <span aria-hidden className="inline-block size-4 rounded-full ring-2 ring-text ring-offset-1 ring-offset-surface" />
          Hoje
        </li>
      </ul>

      <DaySheet day={openDate ? (month.days[openDate] ?? null) : null} onClose={() => setOpenDate(null)} />
    </div>
  );
}
