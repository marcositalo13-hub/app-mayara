// Shapes for the Treino screens. Client-safe (types only).
import type { RepsUnit } from "@/lib/types/db";

export type LoggedSet = {
  set_no: number;
  /** 0 when the exercise has no load (increment_kg = 0). */
  load_kg: number;
  reps: number;
};

export type Suggestion = {
  label: string;
  /** Load to prefill; null for bodyweight/time exercises. */
  suggestedLoad: number | null;
};

export type SessionExercise = {
  /** workout_exercises.id */
  id: string;
  sort: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  reps_unit: RepsUnit;
  per_side: boolean;
  rest_s: number;
  note: string | null;
  exercise: {
    slug: string;
    name_pt: string;
    instructions_pt: string[];
    caution_pt: string | null;
    image_paths: string[];
    increment_kg: number;
  };
  loggedSets: LoggedSet[];
  lastPerformance: { performed_on: string; sets: LoggedSet[] } | null;
  /** null when there is no history; then `hint` explains how to choose. */
  suggestion: Suggestion | null;
  hint: string | null;
};

export type SessionDetail = {
  session: { id: string; started_at: string; finished_at: string | null };
  workout: { id: string; code: string; name: string };
  exercises: SessionExercise[];
};

export type WorkoutPreview = {
  id: string;
  code: string;
  name: string;
  exercises: {
    id: string;
    name_pt: string;
    sets: number;
    reps_min: number;
    reps_max: number;
    reps_unit: RepsUnit;
    per_side: boolean;
  }[];
};

export type CardioWeek = {
  week_no: number;
  targetMinutes: number;
  targetSessions: number;
  rpeMin: number;
  rpeMax: number;
  loggedMinutes: number;
  loggedSessions: number;
};

export type WorkoutScreen =
  | { status: "open"; sessionId: string }
  | {
      status: "ready";
      nextWorkoutId: string | null;
      workouts: WorkoutPreview[];
      cardio: CardioWeek | null;
    };

export type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; message: string };

export type SessionActions = {
  saveSet: (input: {
    sessionId: string;
    workoutExerciseId: string;
    setNo: number;
    loadKg: number | null;
    reps: number;
  }) => Promise<ActionResult>;
  deleteSet: (input: {
    sessionId: string;
    workoutExerciseId: string;
    setNo: number;
  }) => Promise<ActionResult>;
  finishSession: (input: { sessionId: string }) => Promise<ActionResult<{ finishedAt: string }>>;
  discardSession: (input: { sessionId: string }) => Promise<ActionResult>;
  logCardio: CardioAction;
};

export type CardioAction = (input: {
  minutes: number;
  rpe: number;
  modality: string;
}) => Promise<ActionResult>;
