import { Suspense } from "react";
import type { Metadata } from "next";
import { TodayEmpty } from "@/components/today/today-empty";
import { WaterView } from "@/components/water/water-view";
import { getWaterData } from "@/lib/data/water";
import { setWater } from "@/app/actions";

export const metadata: Metadata = { title: "Água · Plano Mayara" };

async function WaterContent() {
  const data = await getWaterData();
  if (data.status === "no_active_week") return <TodayEmpty lastCycleEnd={null} startsOn={null} />;
  return <WaterView data={data} setWater={setWater} />;
}

function WaterSkeleton() {
  const block = "rounded-full bg-surface-alt";
  const card = "rounded-xl bg-surface shadow-soft ring-1 ring-border";
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Carregando a água">
      <div className={`h-8 w-24 ${block}`} />
      <div className={`flex flex-col items-center gap-5 p-5 ${card}`}>
        <div className="h-60 w-[148px] rounded-[40px] bg-accent-soft" />
        <div className={`h-9 w-44 ${block}`} />
        <div className={`h-5 w-32 ${block}`} />
        <div className="grid w-full grid-cols-2 gap-2">
          <div className={`h-14 ${block}`} />
          <div className={`h-14 ${block}`} />
        </div>
        <div className={`h-12 w-32 ${block}`} />
      </div>
      <div className={`h-[180px] ${card}`} />
      <div className={`h-[180px] ${card}`} />
    </div>
  );
}

export default function WaterPage() {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-6 pb-10">
      <Suspense fallback={<WaterSkeleton />}>
        <WaterContent />
      </Suspense>
    </main>
  );
}
