import { Suspense } from "react";
import type { Metadata } from "next";
import { MetasView } from "@/components/body/metas-view";
import { MetasSkeleton } from "@/components/body/metas-skeleton";
import { GoalsSection } from "@/components/goals/goals-section";
import { getBodyData } from "@/lib/data/body";
import { getGoalsData } from "@/lib/data/goals";
import type { GoalsTab } from "@/lib/data/goals-types";
import { getProfile } from "@/lib/data/profile";
import { saveMeasurement } from "./actions";

export const metadata: Metadata = { title: "Metas · Plano Mayara" };

type SearchParams = Promise<{ aba?: string; mes?: string }>;

const parseTab = (value: string | undefined): GoalsTab =>
  value === "semana" || value === "mes" ? value : "dia";

async function MetasContent({ searchParams }: { searchParams: SearchParams }) {
  const { aba, mes } = await searchParams;
  const [data, goals, profile] = await Promise.all([getBodyData(), getGoalsData(mes), getProfile()]);
  return (
    <MetasView
      data={data}
      displayName={profile.displayName}
      avatarUrl={profile.avatarUrl}
      goals={<GoalsSection data={goals} initialTab={parseTab(aba)} hrefBase="/metas?" />}
      saveMeasurement={saveMeasurement}
    />
  );
}

export default function MetasPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-6 pb-10">
      <Suspense fallback={<MetasSkeleton />}>
        <MetasContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
