"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { GoalsData, GoalsTab } from "@/lib/data/goals-types";
import { cn } from "@/lib/utils";
import { FeedbackCards } from "./feedback-cards";
import { DayView, MonthView, WeekView } from "./goal-views";

const TABS: { id: GoalsTab; label: string }[] = [
  { id: "dia", label: "Dia" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
];

type GoalsSectionProps = {
  data: GoalsData;
  initialTab: GoalsTab;
  /** Path + query prefix the month links build on, e.g. "/metas?" (dev preview passes its own). */
  hrefBase: string;
};

export function GoalsSection({ data, initialTab, hrefBase }: GoalsSectionProps) {
  const [tab, setTab] = useState<GoalsTab>(initialTab);
  const index = TABS.findIndex((t) => t.id === tab);

  function select(next: GoalsTab) {
    setTab(next);
    // Keep the tab in the URL (no server round trip), so month links and reloads land on it.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("aba", next);
      window.history.replaceState(window.history.state, "", url);
    } catch {}
  }

  const hrefFor = (key: string) => `${hrefBase}aba=mes&mes=${key}`;

  return (
    <div className="flex flex-col gap-6">
      <FeedbackCards messages={data.feedback} />

      <section aria-label="Metas" className="flex flex-col gap-3">
        <div role="tablist" aria-label="Período" className="relative grid grid-cols-3 rounded-full bg-surface-alt p-1">
          {/* Selected pill slides between tabs (transform only, 200 ms). */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-surface shadow-soft transition-transform duration-200 ease-(--ease-out)"
            style={{ transform: `translateX(${index * 100}%)` }}
          />
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`goals-tab-${t.id}`}
              aria-selected={t.id === tab}
              aria-controls="goals-panel"
              onClick={() => select(t.id)}
              className={cn(
                "relative min-h-12 rounded-full font-bold outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/50",
                t.id === tab ? "text-primary" : "text-text-muted",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card>
          <CardContent
            id="goals-panel"
            role="tabpanel"
            aria-labelledby={`goals-tab-${tab}`}
            className={cn(tab === "mes" && "px-2")}
          >
            {tab === "dia" && <DayView day={data.todayRecord} />}
            {tab === "semana" &&
              (data.week ? (
                <WeekView week={data.week} today={data.today} />
              ) : (
                <p className="rounded-md bg-surface-alt px-4 py-5 text-center text-text-muted">
                  Nenhuma semana de plano em andamento.
                </p>
              ))}
            {tab === "mes" && <MonthView month={data.month} today={data.today} hrefFor={hrefFor} />}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export function GoalsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando as metas" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-24 rounded-full bg-surface-alt" />
        <div className="h-16 rounded-md bg-surface-alt" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-14 rounded-full bg-surface-alt" />
        <div className="h-[260px] rounded-xl bg-surface shadow-soft ring-1 ring-border" />
      </div>
    </div>
  );
}
