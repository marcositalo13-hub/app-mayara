"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentMember } from "@/lib/auth";
import type { ActionResult } from "@/lib/data/workout-types";
import { todayInSaoPaulo } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { CARDIO_MODALITIES } from "@/lib/workout/format";

const SAVE_ERROR = "Não foi possível salvar. Tente de novo.";
const INVALID = "Não foi possível salvar: dados inválidos.";
const NOT_OPEN = "Este treino já foi finalizado ou não existe mais.";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** The user's own session; null when missing or not theirs. */
async function loadSession(supabase: Supabase, sessionId: string, userId: string) {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, workout_id, finished_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("db");
  return data as { id: string; workout_id: string; finished_at: string | null } | null;
}

async function countSets(supabase: Supabase, sessionId: string) {
  const { count, error } = await supabase
    .from("set_logs")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);
  if (error) throw new Error("db");
  return count ?? 0;
}

// ---------------------------------------------------------------------------

export async function startSession(input: {
  workoutId: string;
}): Promise<ActionResult<{ sessionId: string }>> {
  const parsed = z.object({ workoutId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID };
  const member = await getCurrentMember({ required: true });

  try {
    const supabase = await createClient();
    const [cycleRes, workoutRes] = await Promise.all([
      supabase.from("plan_cycles").select("id").eq("is_active", true).maybeSingle(),
      supabase.from("workouts").select("id, cycle_id").eq("id", parsed.data.workoutId).maybeSingle(),
    ]);
    if (cycleRes.error || workoutRes.error) return { ok: false, message: SAVE_ERROR };
    const cycleId = (cycleRes.data as { id: string } | null)?.id;
    const workout = workoutRes.data as { id: string; cycle_id: string } | null;
    if (!cycleId || !workout || workout.cycle_id !== cycleId) {
      return { ok: false, message: "Este treino não faz parte do plano atual." };
    }

    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: member.userId,
        workout_id: workout.id,
        performed_on: todayInSaoPaulo(),
      })
      .select("id")
      .single();

    let sessionId = (data as { id: string } | null)?.id ?? null;
    if (error) {
      // 23505 = one_open_session_per_user: an open session already exists; resume it.
      if (error.code !== "23505") return { ok: false, message: SAVE_ERROR };
      const { data: open, error: openError } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", member.userId)
        .is("finished_at", null)
        .maybeSingle();
      if (openError || !open) return { ok: false, message: SAVE_ERROR };
      sessionId = (open as { id: string }).id;
    }
    if (!sessionId) return { ok: false, message: SAVE_ERROR };

    revalidatePath("/");
    revalidatePath("/treino");
    return { ok: true, sessionId };
  } catch {
    return { ok: false, message: SAVE_ERROR };
  }
}

// ---------------------------------------------------------------------------

const setKeySchema = z.object({
  sessionId: z.uuid(),
  workoutExerciseId: z.uuid(),
  setNo: z.number().int().min(1).max(12),
});

const saveSetSchema = setKeySchema.extend({
  loadKg: z.number().min(0).max(500).multipleOf(0.5).nullable(),
  reps: z.number().int().min(0).max(100),
});

/** Checks shared by saveSet/deleteSet. Returns the plan row, or an error message. */
async function checkSetTarget(
  supabase: Supabase,
  userId: string,
  key: z.infer<typeof setKeySchema>,
): Promise<{ sets: number; incrementKg: number } | { error: string }> {
  const [session, weRes] = await Promise.all([
    loadSession(supabase, key.sessionId, userId),
    supabase
      .from("workout_exercises")
      .select("id, workout_id, sets, exercises ( increment_kg )")
      .eq("id", key.workoutExerciseId)
      .maybeSingle(),
  ]);
  if (weRes.error) throw new Error("db");
  if (!session || session.finished_at) return { error: NOT_OPEN };

  const we = weRes.data as {
    workout_id: string;
    sets: number;
    exercises: { increment_kg: number | string } | null;
  } | null;
  if (!we || we.workout_id !== session.workout_id) {
    return { error: "Este exercício não faz parte do treino em andamento." };
  }
  if (key.setNo > we.sets + 2) return { error: "Limite de séries extras atingido." };
  return { sets: we.sets, incrementKg: Number(we.exercises?.increment_kg ?? 0) };
}

export async function saveSet(input: {
  sessionId: string;
  workoutExerciseId: string;
  setNo: number;
  loadKg: number | null;
  reps: number;
}): Promise<ActionResult> {
  const parsed = saveSetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID };
  const member = await getCurrentMember({ required: true });

  try {
    const supabase = await createClient();
    const target = await checkSetTarget(supabase, member.userId, parsed.data);
    if ("error" in target) return { ok: false, message: target.error };

    const { loadKg } = parsed.data;
    if (loadKg === null && target.incrementKg > 0) {
      return { ok: false, message: "Informe a carga antes de registrar a série." };
    }

    const { error } = await supabase.from("set_logs").upsert(
      {
        session_id: parsed.data.sessionId,
        workout_exercise_id: parsed.data.workoutExerciseId,
        set_no: parsed.data.setNo,
        load_kg: loadKg ?? 0,
        reps: parsed.data.reps,
      },
      { onConflict: "session_id,workout_exercise_id,set_no" },
    );
    if (error) return { ok: false, message: SAVE_ERROR };
  } catch {
    return { ok: false, message: SAVE_ERROR };
  }

  revalidatePath(`/treino/${parsed.data.sessionId}`);
  return { ok: true };
}

export async function deleteSet(input: {
  sessionId: string;
  workoutExerciseId: string;
  setNo: number;
}): Promise<ActionResult> {
  const parsed = setKeySchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID };
  const member = await getCurrentMember({ required: true });

  try {
    const supabase = await createClient();
    const target = await checkSetTarget(supabase, member.userId, parsed.data);
    if ("error" in target) return { ok: false, message: target.error };

    const { error } = await supabase
      .from("set_logs")
      .delete()
      .eq("session_id", parsed.data.sessionId)
      .eq("workout_exercise_id", parsed.data.workoutExerciseId)
      .eq("set_no", parsed.data.setNo);
    if (error) return { ok: false, message: SAVE_ERROR };
  } catch {
    return { ok: false, message: SAVE_ERROR };
  }

  revalidatePath(`/treino/${parsed.data.sessionId}`);
  return { ok: true };
}

// ---------------------------------------------------------------------------

const sessionSchema = z.object({ sessionId: z.uuid() });

export async function finishSession(input: {
  sessionId: string;
}): Promise<ActionResult<{ finishedAt: string }>> {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID };
  const member = await getCurrentMember({ required: true });

  const finishedAt = new Date().toISOString();
  try {
    const supabase = await createClient();
    const session = await loadSession(supabase, parsed.data.sessionId, member.userId);
    if (!session || session.finished_at) return { ok: false, message: NOT_OPEN };
    if ((await countSets(supabase, session.id)) === 0) {
      return { ok: false, message: "Registre pelo menos uma série para finalizar." };
    }

    const { error } = await supabase
      .from("workout_sessions")
      .update({ finished_at: finishedAt })
      .eq("id", session.id)
      .eq("user_id", member.userId)
      .is("finished_at", null);
    if (error) return { ok: false, message: SAVE_ERROR };
  } catch {
    return { ok: false, message: SAVE_ERROR };
  }

  // The session page itself is left alone so the summary can show; it redirects on next visit.
  revalidatePath("/");
  revalidatePath("/treino");
  return { ok: true, finishedAt };
}

export async function discardSession(input: { sessionId: string }): Promise<ActionResult> {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID };
  const member = await getCurrentMember({ required: true });

  try {
    const supabase = await createClient();
    const session = await loadSession(supabase, parsed.data.sessionId, member.userId);
    if (!session || session.finished_at) return { ok: false, message: NOT_OPEN };
    if ((await countSets(supabase, session.id)) > 0) {
      return { ok: false, message: "Este treino já tem séries registradas. Finalize em vez de descartar." };
    }

    const { error } = await supabase
      .from("workout_sessions")
      .delete()
      .eq("id", session.id)
      .eq("user_id", member.userId)
      .is("finished_at", null);
    if (error) return { ok: false, message: SAVE_ERROR };
  } catch {
    return { ok: false, message: SAVE_ERROR };
  }

  revalidatePath("/");
  revalidatePath("/treino");
  return { ok: true };
}

// ---------------------------------------------------------------------------

const cardioSchema = z.object({
  minutes: z.number().int().min(1).max(180),
  rpe: z.number().int().min(1).max(10),
  modality: z.enum(CARDIO_MODALITIES).default("escada"),
});

export async function logCardio(input: {
  minutes: number;
  rpe: number;
  modality: string;
}): Promise<ActionResult> {
  const parsed = cardioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID };
  const member = await getCurrentMember({ required: true });

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("cardio_logs").insert({
      user_id: member.userId,
      performed_on: todayInSaoPaulo(),
      minutes: parsed.data.minutes,
      rpe: parsed.data.rpe,
      modality: parsed.data.modality,
    });
    if (error) return { ok: false, message: SAVE_ERROR };
  } catch {
    return { ok: false, message: SAVE_ERROR };
  }

  revalidatePath("/");
  revalidatePath("/treino");
  return { ok: true };
}
