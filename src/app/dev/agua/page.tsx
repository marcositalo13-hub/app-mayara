import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNavFallback } from "@/components/nav/BottomNav";
import { WaterView } from "@/components/water/water-view";
import type { WaterData, WaterDay } from "@/lib/data/water";
import { addDays } from "@/lib/date";
import { mockSetWater } from "../hoje/mock-actions";

// Dev-only preview of the Água tab: /dev/agua?data=demo|quase|acima|1500|vazio&fail=1

type Ok = Extract<WaterData, { status: "ok" }>;
const TODAY = "2026-10-14";

function history(values: (number | null)[], targets: (number | null)[]): WaterDay[] {
  return values.map((ml, i) => {
    const date = addDays(TODAY, i - 6);
    return { date, ml, targetMl: targets[i], isToday: date === TODAY };
  });
}

// Week 1 (1500 mL) until 2026-10-19; the first days fall before the cycle (no target).
const T = [null, null, 1500, 1500, 1500, 1500, 1500];

const FIXTURES: Record<string, Ok> = {
  demo: { status: "ok", today: TODAY, goalMl: 1500, waterMl: 750, days: history([null, null, 1500, 1250, null, 1750, 750], T) },
  quase: { status: "ok", today: TODAY, goalMl: 1500, waterMl: 1250, days: history([null, null, 1500, 1250, null, 1750, 1250], T) },
  acima: { status: "ok", today: TODAY, goalMl: 2500, waterMl: 3250, days: history([2000, 2500, 3000, 500, 2500, 2750, 3250], [2500, 2500, 2500, 2500, 2500, 2500, 2500]) },
  "2500": { status: "ok", today: TODAY, goalMl: 2500, waterMl: 1000, days: history([1500, null, 2500, 2250, 1000, 2500, 1000], [2000, 2000, 2500, 2500, 2500, 2500, 2500]) },
  vazio: { status: "ok", today: TODAY, goalMl: 1500, waterMl: 0, days: history([null, null, null, null, null, null, null], T) },
};

type SearchParams = Promise<{ data?: string; fail?: string }>;

async function DevWater({ searchParams }: { searchParams: SearchParams }) {
  const { data: name = "demo", fail } = await searchParams;
  const failWrites = fail === "1";
  const data = FIXTURES[name] ?? FIXTURES.demo;

  return (
    <>
      <WaterView key={`${name}-${failWrites}`} data={data} setWater={mockSetWater.bind(null, failWrites)} />
      <nav
        aria-label="Dados de teste"
        className="fixed inset-x-0 top-0 z-50 flex gap-1 overflow-x-auto bg-text p-1 font-mono text-base text-background"
      >
        {Object.keys(FIXTURES).map((f) => (
          <Link
            key={f}
            href={`/dev/agua?data=${f}${failWrites ? "&fail=1" : ""}`}
            className={`shrink-0 rounded-full px-3 py-1 ${f === name ? "bg-background text-text" : ""}`}
          >
            {f}
          </Link>
        ))}
        <Link
          href={`/dev/agua?data=${name}${failWrites ? "" : "&fail=1"}`}
          className="shrink-0 rounded-full px-3 py-1 underline"
        >
          {failWrites ? "falha: on" : "falha: off"}
        </Link>
      </nav>
    </>
  );
}

export default function DevWaterPage({ searchParams }: { searchParams: SearchParams }) {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <>
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-14 pb-24">
        <Suspense>
          <DevWater searchParams={searchParams} />
        </Suspense>
      </main>
      <BottomNavFallback activeIndex={1} />
    </>
  );
}
