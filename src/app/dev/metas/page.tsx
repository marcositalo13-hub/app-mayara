import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNavFallback } from "@/components/nav/BottomNav";
import { MetasView } from "@/components/body/metas-view";
import type { BodyData, BodyPoint, MeasurementResult, WeeklyPoint } from "@/lib/data/body-types";
import { addDays, daysBetween } from "@/lib/date";
import { GoalsSection } from "@/components/goals/goals-section";
import type { GoalsTab } from "@/lib/data/goals-types";
import { GOALS_SCENARIOS, goalsFixture } from "./goals-fixtures";
import { mockSaveMeasurement } from "./mock-actions";

// Dev-only preview of Metas > Corpo: /dev/metas?data=normal|vazio|uma|so-peso|so-cintura|90dias&fail=1

const TODAY = "2026-10-14"; // a Wednesday; weeks start on Mondays

const mondayOf = (date: string) => {
  const dow = (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  return addDays(date, -dow);
};

/** Builds BodyData the way the server does: daily rows + weekly averages + derived values. */
function build(daily: BodyPoint[], allTime: BodyPoint[] = daily): BodyData {
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null);
  const weeks = new Map<string, BodyPoint[]>();
  for (const d of allTime) weeks.set(mondayOf(d.date), [...(weeks.get(mondayOf(d.date)) ?? []), d]);

  const weekly: WeeklyPoint[] = [...weeks.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([weekStart, rows]) => ({
      weekStart,
      avgWeightKg: avg(rows.flatMap((r) => (r.weightKg === null ? [] : [r.weightKg]))),
      avgWaistCm: avg(rows.flatMap((r) => (r.waistCm === null ? [] : [r.waistCm]))),
      entries: rows.length,
    }));

  const weightWeeks = weekly.filter((w) => w.avgWeightKg !== null);
  const waistWeeks = weekly.filter((w) => w.avgWaistCm !== null);
  const latest = (key: "weightKg" | "waistCm") => {
    const row = [...allTime].reverse().find((d) => d[key] !== null);
    return row ? { value: row[key] as number, date: row.date } : null;
  };
  const latestWaist = latest("waistCm");

  return {
    today: TODAY,
    latestWeight: latest("weightKg"),
    latestWaist,
    daily,
    weekly,
    weightWeeks: weightWeeks.length,
    waistWeeks: waistWeeks.length,
    changeSinceStartKg:
      weightWeeks.length >= 2 ? (weightWeeks.at(-1)!.avgWeightKg as number) - (weightWeeks[0].avgWeightKg as number) : null,
    changeSinceStartCm:
      waistWeeks.length >= 2 ? (waistWeeks.at(-1)!.avgWaistCm as number) - (waistWeeks[0].avgWaistCm as number) : null,
    daysSinceLastWaist: latestWaist ? daysBetween(latestWaist.date, TODAY) : null,
  };
}

const p = (offset: number, weightKg: number | null, waistCm: number | null): BodyPoint => ({
  date: addDays(TODAY, offset),
  weightKg,
  waistCm,
});

// A tiny pseudo-random walk, deterministic (no Math.random in render).
function longSeries(): BodyPoint[] {
  const out: BodyPoint[] = [];
  let w = 74.8;
  let c = 84.5;
  for (let i = 89; i >= 0; i--) {
    if (i % 2 === 0 || i < 10) {
      w += Math.sin(i * 1.7) * 0.25 - 0.03;
      if (i % 7 === 0) c += -0.25;
      out.push({
        date: addDays(TODAY, -i),
        weightKg: Math.round(w * 10) / 10,
        waistCm: i % 7 === 0 ? Math.round(c * 2) / 2 : null,
      });
    }
  }
  return out;
}

const FIXTURES: Record<string, BodyData> = {
  normal: build([
    p(-13, 73.4, 82),
    p(-11, 73.0, null),
    p(-9, 72.9, null),
    p(-8, 72.7, 81.5),
    p(-6, 72.6, null),
    p(-4, 72.8, null),
    p(-2, 72.2, 80.5),
    p(0, 72.0, null),
  ]),
  vazio: build([]),
  uma: build([p(0, 72.4, null)]),
  "so-peso": build([p(-9, 73.1, null), p(-6, 72.8, null), p(-2, 72.5, null), p(0, 72.3, null)]),
  "so-cintura": build([p(-9, null, 82), p(-2, null, 81), p(-1, null, 80.5)]),
  "subiu": build([p(-13, 72.0, 80), p(-8, 72.4, 80.5), p(-1, 73.0, 81)]),
  "90dias": build(longSeries()),
};

type SearchParams = Promise<{ data?: string; fail?: string; metas?: string; aba?: string; mes?: string }>;

async function DevMetas({ searchParams }: { searchParams: SearchParams }) {
  const { data: name = "normal", fail, metas = "normal", aba, mes } = await searchParams;
  const goals = goalsFixture(metas, mes);
  const tab: GoalsTab = aba === "semana" || aba === "mes" ? aba : "dia";
  const qs = (over: Record<string, string>) =>
    new URLSearchParams({ data: name, metas, ...(aba ? { aba } : {}), ...over }).toString();
  const failWrites = fail === "1";
  const data = FIXTURES[name] ?? FIXTURES.normal;

  return (
    <>
      <MetasView
        key={`${name}-${failWrites}-${metas}-${mes}`}
        data={data}
        displayName="Mayara"
        avatarUrl={null}
        goals={<GoalsSection data={goals} initialTab={tab} hrefBase={`/dev/metas?data=${name}&metas=${metas}&`} />}
        saveMeasurement={mockSaveMeasurement.bind(null, failWrites) as (i: unknown) => Promise<MeasurementResult>}
      />
      <nav
        aria-label="Dados de teste"
        className="fixed inset-x-0 top-0 z-50 flex gap-1 overflow-x-auto bg-text p-1 font-mono text-base text-background"
      >
        {Object.keys(FIXTURES).map((f) => (
          <Link
            key={f}
            href={`/dev/metas?data=${f}${failWrites ? "&fail=1" : ""}`}
            className={`shrink-0 rounded-full px-3 py-1 ${f === name ? "bg-background text-text" : ""}`}
          >
            {f}
          </Link>
        ))}
        {GOALS_SCENARIOS.map((g) => (
          <Link
            key={g}
            href={`/dev/metas?${qs({ metas: g })}`}
            className={`shrink-0 rounded-full px-3 py-1 underline ${g === metas ? "bg-background text-text" : ""}`}
          >
            {g}
          </Link>
        ))}
        <Link
          href={`/dev/metas?data=${name}${failWrites ? "" : "&fail=1"}`}
          className="shrink-0 rounded-full px-3 py-1 underline"
        >
          {failWrites ? "falha: on" : "falha: off"}
        </Link>
      </nav>
    </>
  );
}

export default function DevMetasPage({ searchParams }: { searchParams: SearchParams }) {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <>
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-14 pb-24">
        <Suspense>
          <DevMetas searchParams={searchParams} />
        </Suspense>
      </main>
      <BottomNavFallback activeIndex={3} />
    </>
  );
}
