"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ListOrdered } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ActionResult, CardioAction, CardioWeek, WorkoutPreview } from "@/lib/data/workout-types";
import { cn } from "@/lib/utils";
import { formatTarget } from "@/lib/workout/format";
import { CardioProgress } from "./cardio-progress";
import { CardioSheet } from "./cardio-sheet";

type WorkoutStartProps = {
  workouts: WorkoutPreview[];
  nextWorkoutId: string | null;
  cardio: CardioWeek | null;
  startSession: (input: { workoutId: string }) => Promise<ActionResult<{ sessionId: string }>>;
  logCardio: CardioAction;
  /** Fixed destination after starting (dev preview only); defaults to /treino/<id>. */
  sessionHref?: string;
};

export function WorkoutStart({
  workouts,
  nextWorkoutId,
  cardio,
  startSession,
  logCardio,
  sessionHref,
}: WorkoutStartProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(nextWorkoutId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cardioOpen, setCardioOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const selected = workouts.find((w) => w.id === selectedId) ?? null;
  const isNext = selected?.id === nextWorkoutId;

  function start() {
    if (!selected) return;
    startTransition(async () => {
      const result = await startSession({ workoutId: selected.id });
      if (!result.ok) {
        toast.error(result.message, { id: "start-error" });
        return;
      }
      router.push(sessionHref ?? `/treino/${result.sessionId}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Treino</h1>

      {selected ? (
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="font-bold text-primary">{isNext ? "Treino da vez" : "Treino escolhido"}</p>
              <h2 className="text-xl [overflow-wrap:anywhere]">
                {selected.code} — {selected.name}
              </h2>
            </div>
            <ol className="flex flex-col divide-y divide-border">
              {selected.exercises.map((ex, i) => (
                <li key={ex.id} className="flex items-baseline gap-3 py-2.5">
                  <span className="w-5 shrink-0 text-text-muted tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{ex.name_pt}</span>
                  <span className="shrink-0 text-text-muted tabular-nums">{formatTarget(ex)}</span>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-2">
              <Button size="lg" onClick={start} disabled={pending} aria-busy={pending}>
                {pending ? "Começando..." : "Começar treino"}
              </Button>
              {workouts.length > 1 && (
                <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
                  <SheetTrigger render={<Button variant="ghost" />}>
                    <ListOrdered data-icon="inline-start" />
                    Escolher outro treino
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Escolher treino</SheetTitle>
                      <SheetDescription>O treino da vez segue a ordem A → B → C → D.</SheetDescription>
                    </SheetHeader>
                    <SheetBody>
                      <div role="radiogroup" aria-label="Treinos" className="flex flex-col gap-2 pt-2">
                        {workouts.map((w) => {
                          const active = w.id === selectedId;
                          return (
                            <button
                              key={w.id}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => {
                                setSelectedId(w.id);
                                setPickerOpen(false);
                              }}
                              className={cn(
                                "pressable flex min-h-16 items-center gap-3 rounded-md px-3 py-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                                active ? "bg-primary-soft" : "bg-surface-alt",
                              )}
                            >
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-lg font-extrabold text-primary">
                                {w.code}
                              </span>
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className="font-bold [overflow-wrap:anywhere]">{w.name}</span>
                                <span className="text-text-muted">
                                  {w.exercises.length} {w.exercises.length === 1 ? "exercício" : "exercícios"}
                                  {w.id === nextWorkoutId ? " · treino da vez" : ""}
                                </span>
                              </span>
                              {active && <Check aria-hidden className="size-5 shrink-0 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    </SheetBody>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="rounded-xl bg-surface-alt px-4 py-5 text-center text-text-muted">
          Nenhum treino no plano atual.
        </p>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-xl">Cardio da semana</h2>
          {cardio ? (
            <CardioProgress week={cardio} />
          ) : (
            <p className="text-text-muted">Sem meta de cardio nesta semana.</p>
          )}
          <Button variant="secondary" onClick={() => setCardioOpen(true)}>
            Registrar cardio
          </Button>
        </CardContent>
      </Card>

      <CardioSheet
        open={cardioOpen}
        onOpenChange={setCardioOpen}
        week={cardio}
        logCardio={logCardio}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
