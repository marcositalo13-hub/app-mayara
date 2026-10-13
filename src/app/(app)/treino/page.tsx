import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { WorkoutStart } from "@/components/workout/workout-start";
import { TreinoSkeleton } from "@/components/workout/workout-skeletons";
import { getWorkoutScreen } from "@/lib/data/workout";
import { logCardio, startSession } from "./actions";

export const metadata: Metadata = { title: "Treino · Plano Mayara" };

async function TreinoContent() {
  const screen = await getWorkoutScreen();
  // A session in progress always takes over the Treino tab.
  if (screen.status === "open") redirect(`/treino/${screen.sessionId}`);

  return (
    <WorkoutStart
      workouts={screen.workouts}
      nextWorkoutId={screen.nextWorkoutId}
      cardio={screen.cardio}
      startSession={startSession}
      logCardio={logCardio}
    />
  );
}

export default function TreinoPage() {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-4 pb-10">
      <Suspense fallback={<TreinoSkeleton />}>
        <TreinoContent />
      </Suspense>
    </main>
  );
}
