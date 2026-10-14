import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getCurrentMember } from "@/lib/auth";
import { todayInSaoPaulo } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { CycleWeekRow, ExerciseRow, WorkoutExerciseRow, WorkoutRow } from "@/lib/types/db";
import { computeSuggestion, NO_HISTORY_HINT } from "@/lib/workout/format";
import type {
  CardioWeek,
  LoggedSet,
  SessionDetail,
  WorkoutPreview,
  WorkoutScreen,
} from "./workout-types";

const LOAD_ERROR = "Falha ao carregar o treino.";
const bySort = (a: { sort: number }, b: { sort: number }) => a.sort - b.sort;

const toSet = (r: { set_no: number; load_kg: number | string; reps: number }): LoggedSet => ({
  set_no: r.set_no,
  load_kg: Number(r.load_kg),
  reps: r.reps,
});

// ---------------------------------------------------------------------------
// Cardio
// ---------------------------------------------------------------------------

/** Current week's cardio target and what was logged in it. Shared by the Treino screens. */
export async function loadCardioWeek(
  supabase: SupabaseClient,
  userId: string,
  today: string,
): Promise<CardioWeek | null> {
  const { data: cycle, error } = await supabase
    .from("plan_cycles")
    .select("cycle_weeks ( week_no, starts_on, ends_on, cardio_minutes, cardio_sessions, rpe_min, rpe_max )")
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(LOAD_ERROR);

  type WeekPick = Pick<
    CycleWeekRow,
    "week_no" | "starts_on" | "ends_on" | "cardio_minutes" | "cardio_sessions" | "rpe_min" | "rpe_max"
  >;
  const weeks = ((cycle as { cycle_weeks: WeekPick[] } | null)?.cycle_weeks ?? []) as WeekPick[];
  const week = weeks.find((w) => w.starts_on <= today && today <= w.ends_on);
  if (!week) return null;

  const { data: logs, error: logsError } = await supabase
    .from("cardio_logs")
    .select("minutes")
    .eq("user_id", userId)
    .gte("performed_on", week.starts_on)
    .lte("performed_on", week.ends_on);
  if (logsError) throw new Error(LOAD_ERROR);

  const rows = (logs ?? []) as { minutes: number }[];
  return {
    week_no: week.week_no,
    targetMinutes: week.cardio_minutes,
    targetSessions: week.cardio_sessions,
    rpeMin: week.rpe_min,
    rpeMax: week.rpe_max,
    loggedMinutes: rows.reduce((sum, r) => sum + r.minutes, 0),
    loggedSessions: rows.length,
  };
}

export async function getCardioWeek(): Promise<CardioWeek | null> {
  const member = await getCurrentMember({ required: true });
  const supabase = await createClient();
  return loadCardioWeek(supabase, member.userId, todayInSaoPaulo());
}

/** Id of the user's unfinished session, if any (any date). */
export async function loadOpenSessionId(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("user_id", userId)
    .is("finished_at", null)
    .maybeSingle();
  if (error) throw new Error(LOAD_ERROR);
  return (data as { id: string } | null)?.id ?? null;
}

// ---------------------------------------------------------------------------
// Treino (start screen)
// ---------------------------------------------------------------------------

type PreviewQueryRow = {
  workouts: (Pick<WorkoutRow, "id" | "code" | "sort" | "name"> & {
    workout_exercises: (Pick<
      WorkoutExerciseRow,
      "id" | "sort" | "sets" | "reps_min" | "reps_max" | "reps_unit" | "per_side"
    > & { exercises: Pick<ExerciseRow, "name_pt" | "purpose_pt"> | null })[];
  })[];
};

export async function getWorkoutScreen(): Promise<WorkoutScreen> {
  const member = await getCurrentMember({ required: true });
  const today = todayInSaoPaulo();
  const supabase = await createClient();

  const [openId, cycleRes, nextRes, cardio] = await Promise.all([
    loadOpenSessionId(supabase, member.userId),
    supabase
      .from("plan_cycles")
      .select(
        `workouts ( id, code, sort, name,
           workout_exercises ( id, sort, sets, reps_min, reps_max, reps_unit, per_side,
             exercises ( name_pt, purpose_pt ) ) )`,
      )
      .eq("is_active", true)
      .maybeSingle(),
    supabase.from("v_next_workout").select("id").maybeSingle(),
    loadCardioWeek(supabase, member.userId, today),
  ]);

  if (openId) return { status: "open", sessionId: openId };
  if (cycleRes.error || nextRes.error) throw new Error(LOAD_ERROR);

  const cycle = cycleRes.data as PreviewQueryRow | null;
  const workouts: WorkoutPreview[] = (cycle?.workouts ?? [])
    .slice()
    .sort(bySort)
    .map((w) => ({
      id: w.id,
      code: w.code,
      name: w.name,
      exercises: (w.workout_exercises ?? [])
        .slice()
        .sort(bySort)
        .map((we) => ({
          id: we.id,
          name_pt: we.exercises?.name_pt ?? "",
          purpose_pt: we.exercises?.purpose_pt ?? null,
          sets: we.sets,
          reps_min: we.reps_min,
          reps_max: we.reps_max,
          reps_unit: we.reps_unit,
          per_side: we.per_side,
        })),
    }));

  const nextId = (nextRes.data as { id: string } | null)?.id ?? null;
  return {
    status: "ready",
    nextWorkoutId: workouts.some((w) => w.id === nextId) ? nextId : (workouts[0]?.id ?? null),
    workouts,
    cardio,
  };
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

type SessionQueryRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
  workouts: (Pick<WorkoutRow, "id" | "code" | "name"> & {
    workout_exercises: (Omit<WorkoutExerciseRow, "workout_id" | "exercise_id" | "created_at"> & {
      exercises: Pick<
        ExerciseRow,
        "slug" | "name_pt" | "instructions_pt" | "caution_pt" | "purpose_pt" | "image_paths" | "increment_kg"
      > | null;
    })[];
  }) | null;
};

type HistorySession = { finished_at: string | null; performed_on: string };
type HistoryRow = {
  workout_exercise_id: string;
  session_id: string;
  set_no: number;
  load_kg: number | string;
  reps: number;
  // Many-to-one embed: an object at runtime, typed as an array by supabase-js inference.
  workout_sessions: HistorySession | HistorySession[] | null;
};

const historySession = (row: HistoryRow): HistorySession | null =>
  Array.isArray(row.workout_sessions) ? (row.workout_sessions[0] ?? null) : row.workout_sessions;

export async function getSessionDetail(sessionId: string): Promise<SessionDetail | null> {
  if (!z.uuid().safeParse(sessionId).success) return null;
  const member = await getCurrentMember({ required: true });
  const supabase = await createClient();
  return loadSessionDetail(supabase, member.userId, sessionId);
}

/** Session detail plus this week's cardio (one auth check for the session page). */
export async function getSessionScreen(
  sessionId: string,
): Promise<{ detail: SessionDetail | null; cardio: CardioWeek | null }> {
  if (!z.uuid().safeParse(sessionId).success) return { detail: null, cardio: null };
  const member = await getCurrentMember({ required: true });
  const supabase = await createClient();
  const [detail, cardio] = await Promise.all([
    loadSessionDetail(supabase, member.userId, sessionId),
    loadCardioWeek(supabase, member.userId, todayInSaoPaulo()),
  ]);
  return { detail, cardio };
}

async function loadSessionDetail(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string,
): Promise<SessionDetail | null> {

  const [sessionRes, setsRes] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select(
        `id, started_at, finished_at,
         workouts ( id, code, name,
           workout_exercises ( id, sort, sets, reps_min, reps_max, reps_unit, per_side, rest_s, note,
             exercises ( slug, name_pt, instructions_pt, caution_pt, purpose_pt, image_paths, increment_kg ) ) )`,
      )
      .eq("id", sessionId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("set_logs")
      .select("workout_exercise_id, set_no, load_kg, reps")
      .eq("session_id", sessionId),
  ]);
  if (sessionRes.error || setsRes.error) throw new Error(LOAD_ERROR);

  const session = sessionRes.data as SessionQueryRow | null;
  if (!session || !session.workouts) return null;

  const plan = (session.workouts.workout_exercises ?? []).slice().sort(bySort);
  const ids = plan.map((we) => we.id);

  // Sets of this user's finished sessions for the same workout_exercises (most recent first).
  const history = new Map<string, { finishedAt: string; performedOn: string; sets: LoggedSet[] }>();
  if (ids.length > 0) {
    const { data, error } = await supabase
      .from("set_logs")
      .select(
        "workout_exercise_id, session_id, set_no, load_kg, reps, workout_sessions!inner ( user_id, finished_at, performed_on )",
      )
      .in("workout_exercise_id", ids)
      .neq("session_id", sessionId)
      .eq("workout_sessions.user_id", userId)
      .not("workout_sessions.finished_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(600);
    if (error) throw new Error(LOAD_ERROR);

    // Keep, per exercise, only the sets of the session that finished last.
    const latestSession = new Map<string, { sessionId: string; finishedAt: string; performedOn: string }>();
    for (const row of (data ?? []) as unknown as HistoryRow[]) {
      const finishedAt = historySession(row)?.finished_at;
      if (!finishedAt) continue;
      const current = latestSession.get(row.workout_exercise_id);
      if (!current || finishedAt > current.finishedAt) {
        latestSession.set(row.workout_exercise_id, {
          sessionId: row.session_id,
          finishedAt,
          performedOn: historySession(row)?.performed_on ?? "",
        });
      }
    }
    for (const row of (data ?? []) as unknown as HistoryRow[]) {
      const latest = latestSession.get(row.workout_exercise_id);
      if (!latest || latest.sessionId !== row.session_id) continue;
      const entry = history.get(row.workout_exercise_id) ?? {
        finishedAt: latest.finishedAt,
        performedOn: latest.performedOn,
        sets: [],
      };
      entry.sets.push(toSet(row));
      history.set(row.workout_exercise_id, entry);
    }
  }

  const logged = (setsRes.data ?? []) as {
    workout_exercise_id: string;
    set_no: number;
    load_kg: number | string;
    reps: number;
  }[];

  return {
    session: { id: session.id, started_at: session.started_at, finished_at: session.finished_at },
    workout: { id: session.workouts.id, code: session.workouts.code, name: session.workouts.name },
    exercises: plan.map((we) => {
      const ex = we.exercises;
      const incrementKg = Number(ex?.increment_kg ?? 0);
      const last = history.get(we.id) ?? null;
      const lastSets = last ? last.sets.slice().sort((a, b) => a.set_no - b.set_no) : null;
      const suggestion = computeSuggestion(lastSets, {
        sets: we.sets,
        reps_max: we.reps_max,
        reps_unit: we.reps_unit,
        increment_kg: incrementKg,
      });
      return {
        id: we.id,
        sort: we.sort,
        sets: we.sets,
        reps_min: we.reps_min,
        reps_max: we.reps_max,
        reps_unit: we.reps_unit,
        per_side: we.per_side,
        rest_s: we.rest_s,
        note: we.note,
        exercise: {
          slug: ex?.slug ?? "",
          name_pt: ex?.name_pt ?? "Exercício",
          instructions_pt: ex?.instructions_pt ?? [],
          caution_pt: ex?.caution_pt ?? null,
          purpose_pt: ex?.purpose_pt ?? null,
          image_paths: ex?.image_paths ?? [],
          increment_kg: incrementKg,
        },
        loggedSets: logged
          .filter((l) => l.workout_exercise_id === we.id)
          .map(toSet)
          .sort((a, b) => a.set_no - b.set_no),
        lastPerformance: last && lastSets ? { performed_on: last.performedOn, sets: lastSets } : null,
        suggestion,
        hint: suggestion ? null : NO_HISTORY_HINT,
      };
    }),
  };
}
