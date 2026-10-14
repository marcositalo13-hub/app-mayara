import { Suspense } from "react";
import { TodayEmpty } from "@/components/today/today-empty";
import { TodaySkeleton } from "@/components/today/today-skeleton";
import { TodayView } from "@/components/today/today-view";
import { getTodayData } from "@/lib/data/today";
import { formatDayMonth } from "@/lib/date";
import { setMealDone } from "@/app/actions";

async function DietContent() {
  const data = await getTodayData();

  if (data.status === "no_active_week") {
    return (
      <TodayEmpty
        lastCycleEnd={data.lastCycleEnd ? formatDayMonth(data.lastCycleEnd) : null}
        startsOn={data.startsOn ? formatDayMonth(data.startsOn) : null}
      />
    );
  }

  return <TodayView data={data} actions={{ setMealDone }} />;
}

export default function DietPage() {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-6 pb-10">
      <h1 className="sr-only">Dieta</h1>
      <Suspense fallback={<TodaySkeleton />}>
        <DietContent />
      </Suspense>
    </main>
  );
}
