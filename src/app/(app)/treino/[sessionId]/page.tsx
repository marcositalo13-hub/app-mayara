import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SessionView } from "@/components/workout/session-view";
import { SessionSkeleton } from "@/components/workout/workout-skeletons";
import { getSessionScreen } from "@/lib/data/workout";
import { deleteSet, discardSession, finishSession, logCardio, saveSet } from "../actions";

export const metadata: Metadata = { title: "Treino em andamento · Plano Mayara" };

type Params = Promise<{ sessionId: string }>;

async function SessionContent({ params }: { params: Params }) {
  const { sessionId } = await params;
  const { detail, cardio } = await getSessionScreen(sessionId);
  if (!detail) notFound();
  if (detail.session.finished_at) redirect("/treino");

  return (
    <SessionView
      detail={detail}
      cardio={cardio}
      actions={{ saveSet, deleteSet, finishSession, discardSession, logCardio }}
    />
  );
}

export default function SessionPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-4 pb-10">
      <Suspense fallback={<SessionSkeleton />}>
        <SessionContent params={params} />
      </Suspense>
    </main>
  );
}
