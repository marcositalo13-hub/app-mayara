import { Suspense } from "react";
import type { Metadata } from "next";
import { MetasView } from "@/components/body/metas-view";
import { MetasSkeleton } from "@/components/body/metas-skeleton";
import { getBodyData } from "@/lib/data/body";
import { getProfile } from "@/lib/data/profile";
import { saveMeasurement } from "./actions";

export const metadata: Metadata = { title: "Metas · Plano Mayara" };

async function MetasContent() {
  const [data, profile] = await Promise.all([getBodyData(), getProfile()]);
  return (
    <MetasView
      data={data}
      displayName={profile.displayName}
      avatarUrl={profile.avatarUrl}
      saveMeasurement={saveMeasurement}
    />
  );
}

export default function MetasPage() {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-6 pb-10">
      <Suspense fallback={<MetasSkeleton />}>
        <MetasContent />
      </Suspense>
    </main>
  );
}
