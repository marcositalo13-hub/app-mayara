"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { CelebrationBurst } from "@/components/cute";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useNow } from "@/hooks/use-now";
import type {
  CardioWeek,
  LoggedSet,
  SessionActions,
  SessionDetail,
  SessionExercise,
} from "@/lib/data/workout-types";
import { formatClock, formatKg } from "@/lib/workout/format";
import { CardioSheet } from "./cardio-sheet";
import { ExerciseCard } from "./exercise-card";
import { RestTimer, type RestState } from "./rest-timer";

/** workout_exercise id → set number → logged set */
type SetMap = Record<string, Record<number, LoggedSet>>;
type SetChange =
  | { type: "save"; weId: string; set: LoggedSet }
  | { type: "delete"; weId: string; setNo: number };

const EDIT_DEBOUNCE_MS = 700;
const DONE_PILL_MS = 4000;

const toSetMap = (detail: SessionDetail): SetMap =>
  Object.fromEntries(
    detail.exercises.map((ex) => [ex.id, Object.fromEntries(ex.loggedSets.map((s) => [s.set_no, s]))]),
  );

function applyChange(state: SetMap, change: SetChange): SetMap {
  const current = { ...(state[change.weId] ?? {}) };
  if (change.type === "save") current[change.set.set_no] = change.set;
  else delete current[change.setNo];
  return { ...state, [change.weId]: current };
}

/** Consecutive exercises joined by rest_s = 0 form a bi-set group. */
function groupBiSets(exercises: SessionExercise[]): SessionExercise[][] {
  const groups: SessionExercise[][] = [];
  let current: SessionExercise[] = [];
  for (const ex of exercises) {
    current.push(ex);
    if (ex.rest_s > 0) {
      groups.push(current);
      current = [];
    }
  }
  if (current.length) groups.push(current);
  return groups;
}

/** Rest ending `seconds` from now (absolute, so it survives screen lock). Called from event handlers. */
const newRest = (id: number, seconds: number): RestState => ({
  id,
  endsAt: Date.now() + seconds * 1000,
  durationMs: seconds * 1000,
  done: false,
});

type Summary = { durationMs: number; sets: number; volumeKg: number };
type Phase = "active" | "confirm-finish" | "confirm-discard" | "summary" | "cardio";

type SessionViewProps = {
  detail: SessionDetail;
  cardio: CardioWeek | null;
  actions: SessionActions;
  /** Where to go when done; the dev preview overrides these. */
  homeHref?: string;
  treinoHref?: string;
};

export function SessionView({ detail, cardio, actions, homeHref = "/treino", treinoHref = "/treino" }: SessionViewProps) {
  const router = useRouter();
  const sessionId = detail.session.id;

  // Confirmed sets follow the server (props) and get optimistic changes on top.
  const [synced, setSynced] = useState(detail);
  const [confirmed, setConfirmed] = useState(() => toSetMap(detail));
  if (synced !== detail) {
    setSynced(detail);
    setConfirmed(toSetMap(detail));
  }
  const [sets, applySet] = useOptimistic(confirmed, applyChange);
  const [, startSetTransition] = useTransition();
  const [finishing, startFinish] = useTransition();

  const [phase, setPhase] = useState<Phase>("active");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rest, setRest] = useState<RestState | null>(null);
  const restSeq = useRef(0);
  const restTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const editTimers = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; run: () => void }>());
  const restRef = useRef<RestState | null>(null);

  const now = useNow();
  const startedAt = Date.parse(detail.session.started_at);
  const elapsed = now === null ? null : (now - startedAt) / 1000;

  const plannedTotal = detail.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const plannedDone = detail.exercises.reduce(
    (sum, ex) => sum + Object.keys(sets[ex.id] ?? {}).filter((n) => Number(n) <= ex.sets).length,
    0,
  );
  const allLogged = Object.values(sets).flatMap((m) => Object.values(m));
  const totalLogged = allLogged.length;

  // ---- rest timer -------------------------------------------------------
  function clearRestTimers() {
    restTimers.current.forEach(clearTimeout);
    restTimers.current = [];
  }

  function finishRest(id: number) {
    if (restRef.current?.id !== id || restRef.current.done) return;
    const done = { ...restRef.current, done: true };
    restRef.current = done;
    setRest(done);
    toast("Bora para a próxima!", { id: "rest-done" });
    restTimers.current.push(
      setTimeout(() => {
        if (restRef.current?.id === id) {
          restRef.current = null;
          setRest(null);
        }
      }, DONE_PILL_MS),
    );
  }

  function startRest(seconds: number) {
    clearRestTimers();
    const id = ++restSeq.current;
    const next = newRest(id, seconds);
    restRef.current = next;
    setRest(next);
    restTimers.current.push(setTimeout(() => finishRest(id), seconds * 1000));
  }

  function dismissRest() {
    clearRestTimers();
    restRef.current = null;
    setRest(null);
  }

  useEffect(() => {
    // Timers may fire late after the screen was locked; check on return.
    const onVisible = () => {
      const r = restRef.current;
      if (document.visibilityState === "visible" && r && !r.done && Date.now() >= r.endsAt) finishRest(r.id);
    };
    document.addEventListener("visibilitychange", onVisible);
    const edits = editTimers.current;
    const timers = restTimers;
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      timers.current.forEach(clearTimeout);
      // Send pending edits instead of dropping them.
      edits.forEach(({ timer, run }) => {
        clearTimeout(timer);
        run();
      });
      edits.clear();
    };
  }, []);

  // ---- sets ---------------------------------------------------------------
  function persist(ex: SessionExercise, set: LoggedSet, loadKg: number | null) {
    startSetTransition(async () => {
      applySet({ type: "save", weId: ex.id, set });
      const result = await actions.saveSet({
        sessionId,
        workoutExerciseId: ex.id,
        setNo: set.set_no,
        loadKg,
        reps: set.reps,
      });
      if (!result.ok) {
        toast.error(result.message, { id: "set-error" });
        return;
      }
      setConfirmed((prev) => applyChange(prev, { type: "save", weId: ex.id, set }));
    });
  }

  function checkSet(ex: SessionExercise, setNo: number, load: number | null, reps: number): boolean {
    const hasLoad = ex.exercise.increment_kg > 0;
    if (hasLoad && load === null) {
      toast.error("Informe a carga antes de registrar a série.", { id: "set-error" });
      return false;
    }
    persist(ex, { set_no: setNo, load_kg: hasLoad ? (load ?? 0) : 0, reps }, hasLoad ? load : null);
    if (ex.rest_s > 0) startRest(ex.rest_s);
    return true;
  }

  function uncheckSet(ex: SessionExercise, setNo: number) {
    const key = `${ex.id}:${setNo}`;
    const pending = editTimers.current.get(key);
    if (pending) {
      clearTimeout(pending.timer);
      editTimers.current.delete(key);
    }
    startSetTransition(async () => {
      applySet({ type: "delete", weId: ex.id, setNo });
      const result = await actions.deleteSet({ sessionId, workoutExerciseId: ex.id, setNo });
      if (!result.ok) {
        toast.error(result.message, { id: "set-error" });
        return;
      }
      setConfirmed((prev) => applyChange(prev, { type: "delete", weId: ex.id, setNo }));
    });
  }

  function editLogged(ex: SessionExercise, setNo: number, load: number | null, reps: number) {
    const hasLoad = ex.exercise.increment_kg > 0;
    if (hasLoad && load === null) return;
    const key = `${ex.id}:${setNo}`;
    const existing = editTimers.current.get(key);
    if (existing) clearTimeout(existing.timer);
    const run = () => {
      editTimers.current.delete(key);
      persist(ex, { set_no: setNo, load_kg: hasLoad ? (load ?? 0) : 0, reps }, hasLoad ? load : null);
    };
    editTimers.current.set(key, { timer: setTimeout(run, EDIT_DEBOUNCE_MS), run });
  }

  function flushEdits() {
    editTimers.current.forEach(({ timer, run }) => {
      clearTimeout(timer);
      run();
    });
  }

  // ---- finish / discard ---------------------------------------------------
  function finish() {
    flushEdits();
    const volumeKg = allLogged.reduce((sum, s) => sum + s.load_kg * s.reps, 0);
    startFinish(async () => {
      const result = await actions.finishSession({ sessionId });
      if (!result.ok) {
        toast.error(result.message, { id: "finish-error" });
        setPhase("active");
        return;
      }
      dismissRest();
      setSummary({
        durationMs: Date.parse(result.finishedAt) - startedAt,
        sets: totalLogged,
        volumeKg,
      });
      setPhase("summary");
    });
  }

  function discard() {
    startFinish(async () => {
      const result = await actions.discardSession({ sessionId });
      if (!result.ok) {
        toast.error(result.message, { id: "finish-error" });
        setPhase("active");
        return;
      }
      router.replace(treinoHref);
    });
  }

  const goHome = () => router.replace(homeHref);

  return (
    <div className="flex flex-col gap-5 pb-20">
      <header className="flex flex-col gap-2">
        <p className="font-bold text-primary">Treino {detail.workout.code} · em andamento</p>
        <h1 className="text-2xl [overflow-wrap:anywhere]">{detail.workout.name}</h1>
        <p className="flex items-center gap-2 text-text-muted tabular-nums">
          <Clock aria-hidden className="size-4" />
          <span>{elapsed === null ? "--:--" : formatClock(elapsed)}</span>
          <span aria-hidden>·</span>
          <span>
            {plannedDone} de {plannedTotal} séries
          </span>
        </p>
        <div
          role="progressbar"
          aria-label="Séries registradas"
          aria-valuemin={0}
          aria-valuemax={plannedTotal}
          aria-valuenow={plannedDone}
          className="h-2.5 overflow-hidden rounded-full bg-surface-alt"
        >
          <div
            className="h-full origin-left rounded-full bg-primary transition-transform duration-300 ease-(--ease-out)"
            style={{ transform: `scaleX(${plannedTotal ? plannedDone / plannedTotal : 0})` }}
          />
        </div>
      </header>

      {groupBiSets(detail.exercises).map((group) => {
        const cards = group.map((ex) => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            logged={sets[ex.id] ?? {}}
            onCheck={(n, load, reps) => checkSet(ex, n, load, reps)}
            onUncheck={(n) => uncheckSet(ex, n)}
            onEditLogged={(n, load, reps) => editLogged(ex, n, load, reps)}
          />
        ));
        if (group.length === 1) return cards[0];
        return (
          <section
            key={group[0].id}
            aria-label="Bi-set"
            className="flex flex-col gap-3 rounded-[28px] bg-accent-soft p-2"
          >
            <p className="px-3 pt-2 font-bold text-accent">
              Bi-set: faça um exercício seguido do outro, sem descanso entre eles
            </p>
            {cards}
          </section>
        );
      })}

      <div className="flex flex-col gap-2">
        <Button size="lg" onClick={() => setPhase("confirm-finish")} disabled={finishing}>
          Finalizar treino
        </Button>
        {totalLogged === 0 && (
          <Button variant="ghost" onClick={() => setPhase("confirm-discard")} disabled={finishing}>
            Descartar treino
          </Button>
        )}
      </div>

      <RestTimer rest={rest} onDismiss={dismissRest} />

      {/* Finish confirmation */}
      <Sheet open={phase === "confirm-finish"} onOpenChange={(o) => !o && !finishing && setPhase("active")}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Finalizar treino?</SheetTitle>
            <SheetDescription>
              Você registrou {plannedDone} de {plannedTotal} séries.
              {plannedDone < plannedTotal ? " As que faltam ficam sem registro." : ""}
            </SheetDescription>
          </SheetHeader>
          <SheetBody className="flex flex-col gap-2 pt-2">
            <Button size="lg" onClick={finish} disabled={finishing} aria-busy={finishing}>
              {finishing ? "Finalizando..." : "Finalizar"}
            </Button>
            <Button variant="ghost" onClick={() => setPhase("active")} disabled={finishing}>
              Continuar treinando
            </Button>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Discard confirmation */}
      <Sheet open={phase === "confirm-discard"} onOpenChange={(o) => !o && !finishing && setPhase("active")}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Descartar treino?</SheetTitle>
            <SheetDescription>Nenhuma série foi registrada. O treino da vez continua o mesmo.</SheetDescription>
          </SheetHeader>
          <SheetBody className="flex flex-col gap-2 pt-2">
            <Button size="lg" onClick={discard} disabled={finishing} aria-busy={finishing}>
              {finishing ? "Descartando..." : "Descartar"}
            </Button>
            <Button variant="ghost" onClick={() => setPhase("active")} disabled={finishing}>
              Voltar
            </Button>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {/* Summary */}
      <Sheet open={phase === "summary"} onOpenChange={(o) => !o && goHome()}>
        <SheetContent>
          <SheetHeader className="relative items-center pr-5 text-center">
            <SheetTitle className="text-2xl">Treino concluído!</SheetTitle>
            <SheetDescription>
              Treino {detail.workout.code} — {detail.workout.name}
            </SheetDescription>
            {phase === "summary" && <CelebrationBurst />}
          </SheetHeader>
          <SheetBody className="flex flex-col gap-5 pt-3">
            {summary && (
              <dl className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Duração" value={formatDuration(summary.durationMs)} />
                <Stat label="Séries" value={String(summary.sets)} />
                <Stat label="Volume" value={`${formatKg(Math.round(summary.volumeKg))} kg`} />
              </dl>
            )}
            <div className="flex flex-col gap-2">
              <Button size="lg" variant="secondary" onClick={() => setPhase("cardio")}>
                Registrar cardio agora
              </Button>
              <Button size="lg" onClick={goHome}>
                Concluir
              </Button>
            </div>
          </SheetBody>
        </SheetContent>
      </Sheet>

      <CardioSheet
        open={phase === "cardio"}
        onOpenChange={(o) => !o && goHome()}
        week={cardio}
        logCardio={actions.logCardio}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-surface-alt px-2 py-3">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-lg font-extrabold tabular-nums [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

/** 2_880_000 → "48 min", 4_500_000 → "1 h 15 min" */
function formatDuration(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
