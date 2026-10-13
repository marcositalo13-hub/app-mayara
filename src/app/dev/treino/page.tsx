import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BottomNavFallback } from "@/components/nav/BottomNav";
import { SessionView } from "@/components/workout/session-view";
import { WorkoutStart } from "@/components/workout/workout-start";
import { cardioWeek, sessionFixture, startFixture } from "./fixtures";
import {
  mockDeleteSet,
  mockDiscardSession,
  mockFinishSession,
  mockLogCardio,
  mockSaveSet,
  mockStartSession,
} from "./mock-actions";

// Dev-only preview of the Treino screens: /dev/treino?data=sessao|worst|inicio|sem-cardio&fail=1

const STATES = ["inicio", "sem-cardio", "sessao", "worst"];
type SearchParams = Promise<{ data?: string; fail?: string }>;

async function DevTreino({ searchParams }: { searchParams: SearchParams }) {
  const { data: name = "sessao", fail } = await searchParams;
  await connection(); // fixtures use the current time
  const failWrites = fail === "1";
  const logCardio = mockLogCardio.bind(null, failWrites);

  return (
    <>
      {name === "inicio" || name === "sem-cardio" ? (
        <WorkoutStart
          key={name}
          workouts={startFixture.workouts}
          nextWorkoutId={startFixture.nextWorkoutId}
          cardio={name === "inicio" ? cardioWeek : null}
          startSession={mockStartSession}
          logCardio={logCardio}
          sessionHref="/dev/treino?data=sessao"
        />
      ) : (
        <SessionView
          key={`${name}-${failWrites}`}
          detail={sessionFixture(name)}
          cardio={cardioWeek}
          homeHref="/dev/hoje"
          treinoHref="/dev/treino?data=inicio"
          actions={{
            saveSet: mockSaveSet.bind(null, failWrites),
            deleteSet: mockDeleteSet.bind(null, failWrites),
            finishSession: mockFinishSession.bind(null, failWrites),
            discardSession: mockDiscardSession.bind(null, failWrites),
            logCardio,
          }}
        />
      )}

      <nav
        aria-label="Dados de teste"
        className="fixed inset-x-0 top-0 z-50 flex gap-1 overflow-x-auto bg-text p-1 font-mono text-base text-background"
      >
        {STATES.map((s) => (
          <Link
            key={s}
            href={`/dev/treino?data=${s}${failWrites ? "&fail=1" : ""}`}
            className={`shrink-0 rounded-full px-3 py-1 ${s === name ? "bg-background text-text" : ""}`}
          >
            {s}
          </Link>
        ))}
        <Link
          href={`/dev/treino?data=${name}${failWrites ? "" : "&fail=1"}`}
          className="shrink-0 rounded-full px-3 py-1 underline"
        >
          {failWrites ? "falha: on" : "falha: off"}
        </Link>
      </nav>
    </>
  );
}

export default function DevTreinoPage({ searchParams }: { searchParams: SearchParams }) {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <>
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-14 pb-24">
        <Suspense>
          <DevTreino searchParams={searchParams} />
        </Suspense>
      </main>
      <BottomNavFallback activeIndex={1} />
    </>
  );
}
