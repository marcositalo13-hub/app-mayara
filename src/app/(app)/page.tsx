import { Suspense } from "react";
import { TodayEmpty } from "@/components/today/today-empty";
import { TodayHeader } from "@/components/today/today-header";
import { TodaySkeleton } from "@/components/today/today-skeleton";
import { TodayView } from "@/components/today/today-view";
import { getTodayData } from "@/lib/data/today";
import { formatDayMonth, formatLongDate } from "@/lib/date";
import { setMealDone, setWater, signOut } from "@/app/actions";

async function TodayContent() {
  const data = await getTodayData();
  // Dates are formatted on the server so the client renders the exact same text.
  const dateLabel = formatLongDate(data.today);

  if (data.status === "no_active_week") {
    return (
      <div className="flex flex-col gap-6">
        <TodayHeader
          displayName={data.member.displayName}
          dateLabel={dateLabel}
          weekLabel={null}
          isAdmin={data.member.role === "admin"}
          signOut={signOut}
        />
        <TodayEmpty
          lastCycleEnd={data.lastCycleEnd ? formatDayMonth(data.lastCycleEnd) : null}
          startsOn={data.startsOn ? formatDayMonth(data.startsOn) : null}
        />
      </div>
    );
  }

  return (
    <TodayView data={data} dateLabel={dateLabel} actions={{ setMealDone, setWater, signOut }} />
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-4 pb-10">
      <Suspense fallback={<TodaySkeleton />}>
        <TodayContent />
      </Suspense>
    </main>
  );
}
