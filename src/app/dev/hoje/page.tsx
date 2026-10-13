import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TodayEmpty } from "@/components/today/today-empty";
import { TodayHeader } from "@/components/today/today-header";
import { TodayView } from "@/components/today/today-view";
import { formatDayMonth, formatLongDate } from "@/lib/date";
import { FIXTURE_NAMES, getFixture } from "./fixtures";
import { mockSetMealDone, mockSetWater, mockSignOut } from "./mock-actions";

// Dev-only preview of the Hoje screen with fixtures: /dev/hoje?data=worst&fail=1

type SearchParams = Promise<{ data?: string; fail?: string }>;

async function DevToday({ searchParams }: { searchParams: SearchParams }) {
  const { data: name = "demo", fail } = await searchParams;
  const failWrites = fail === "1";
  const data = getFixture(name);
  const dateLabel = formatLongDate(data.today);

  return (
    <>
      {data.status === "ok" ? (
        <TodayView
          key={`${name}-${failWrites}`}
          data={data}
          dateLabel={dateLabel}
          actions={{
            setMealDone: mockSetMealDone.bind(null, failWrites),
            setWater: mockSetWater.bind(null, failWrites),
            signOut: mockSignOut,
          }}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <TodayHeader
            displayName={data.member.displayName}
            dateLabel={dateLabel}
            weekLabel={null}
            isAdmin={false}
            signOut={mockSignOut}
          />
          <TodayEmpty
            lastCycleEnd={data.lastCycleEnd ? formatDayMonth(data.lastCycleEnd) : null}
            startsOn={data.startsOn ? formatDayMonth(data.startsOn) : null}
          />
        </div>
      )}

      <nav
        aria-label="Dados de teste"
        className="fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto bg-text p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] font-mono text-base text-background"
      >
        {FIXTURE_NAMES.map((f) => (
          <Link
            key={f}
            href={`/dev/hoje?data=${f}${failWrites ? "&fail=1" : ""}`}
            className={`shrink-0 rounded-full px-3 py-2 ${f === name ? "bg-background text-text" : ""}`}
          >
            {f}
          </Link>
        ))}
        <Link
          href={`/dev/hoje?data=${name}${failWrites ? "" : "&fail=1"}`}
          className="shrink-0 rounded-full px-3 py-2 underline"
        >
          {failWrites ? "falha: on" : "falha: off"}
        </Link>
      </nav>
    </>
  );
}

export default function DevHojePage({ searchParams }: { searchParams: SearchParams }) {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-4 pb-28">
      <Suspense>
        <DevToday searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
