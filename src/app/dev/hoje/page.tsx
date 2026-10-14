import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountHeader } from "@/components/nav/account-header";
import { BottomNavFallback } from "@/components/nav/BottomNav";
import { TodayEmpty } from "@/components/today/today-empty";
import { TodayView } from "@/components/today/today-view";
import { formatDayMonth, formatLongDate } from "@/lib/date";
import { FIXTURE_NAMES, getFixture } from "./fixtures";
import { mockNoop, mockSetMealDone, mockSignOut } from "./mock-actions";

// Dev-only preview of the Dieta tab with fixtures: /dev/hoje?data=worst&fail=1

type SearchParams = Promise<{ data?: string; fail?: string }>;

async function DevDiet({ searchParams }: { searchParams: SearchParams }) {
  const { data: name = "demo", fail } = await searchParams;
  const failWrites = fail === "1";
  const data = getFixture(name);

  return (
    <>
      <AccountHeader
        userId="00000000-0000-4000-8000-000000000001"
        displayName={data.member.displayName}
        avatarUrl={null}
        dateLabel={formatLongDate(data.today)}
        weekLabel={data.status === "ok" ? `Semana ${data.week.week_no} de ${data.week.total_weeks}` : null}
        isAdmin={data.member.role === "admin"}
        actions={{
          setAvatar: mockNoop,
          removeAvatar: mockNoop,
          signOut: mockSignOut,
        }}
      />
      <div className="pt-6">
        {data.status === "ok" ? (
          <TodayView
            key={`${name}-${failWrites}`}
            data={data}
            actions={{ setMealDone: mockSetMealDone.bind(null, failWrites) }}
          />
        ) : (
          <TodayEmpty
            lastCycleEnd={data.lastCycleEnd ? formatDayMonth(data.lastCycleEnd) : null}
            startsOn={data.startsOn ? formatDayMonth(data.startsOn) : null}
          />
        )}
      </div>

      <nav
        aria-label="Dados de teste"
        className="fixed inset-x-0 top-0 z-50 flex gap-1 overflow-x-auto bg-text p-1 font-mono text-base text-background"
      >
        {FIXTURE_NAMES.map((f) => (
          <Link
            key={f}
            href={`/dev/hoje?data=${f}${failWrites ? "&fail=1" : ""}`}
            className={`shrink-0 rounded-full px-3 py-1 ${f === name ? "bg-background text-text" : ""}`}
          >
            {f}
          </Link>
        ))}
        <Link
          href={`/dev/hoje?data=${name}${failWrites ? "" : "&fail=1"}`}
          className="shrink-0 rounded-full px-3 py-1 underline"
        >
          {failWrites ? "falha: on" : "falha: off"}
        </Link>
      </nav>
    </>
  );
}

export default function DevDietPage({ searchParams }: { searchParams: SearchParams }) {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <>
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-14 pb-24">
        <Suspense>
          <DevDiet searchParams={searchParams} />
        </Suspense>
      </main>
      <BottomNavFallback activeIndex={0} />
    </>
  );
}
