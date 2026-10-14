"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentMember } from "@/lib/auth";
import type { ActionResult } from "@/lib/data/today-types";
import { todayInSaoPaulo } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { parseTheme, THEME_COOKIE, THEME_MAX_AGE_S, THEMES, type Theme } from "@/lib/theme";

const SAVE_ERROR = "Não foi possível salvar. Tente de novo.";
const INVALID = "Não foi possível salvar: dados inválidos.";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut(); // clears the session cookies via setAll
  redirect("/entrar");
}

const mealDoneSchema = z.object({
  mealId: z.uuid(),
  optionId: z.uuid(),
  done: z.boolean(),
});

export async function setMealDone(input: {
  mealId: string;
  optionId: string;
  done: boolean;
}): Promise<ActionResult> {
  const parsed = mealDoneSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID };
  const { mealId, optionId, done } = parsed.data;

  const member = await getCurrentMember({ required: true });
  const today = todayInSaoPaulo();

  try {
    const supabase = await createClient();

    // The option must belong to the meal, and the meal to the active cycle.
    const [cycleRes, optionRes] = await Promise.all([
      supabase.from("plan_cycles").select("id").eq("is_active", true).maybeSingle(),
      supabase
        .from("meal_options")
        .select("id, meal_id, meals!inner ( cycle_id )")
        .eq("id", optionId)
        .maybeSingle(),
    ]);
    if (cycleRes.error || optionRes.error) return { ok: false, message: SAVE_ERROR };

    const cycleId = (cycleRes.data as { id: string } | null)?.id;
    const option = optionRes.data as
      | { id: string; meal_id: string; meals: { cycle_id: string } | null }
      | null;
    if (!cycleId || !option || option.meal_id !== mealId || option.meals?.cycle_id !== cycleId) {
      return { ok: false, message: "Esta refeição não faz parte do plano atual." };
    }

    const { error } = done
      ? await supabase.from("meal_logs").upsert(
          {
            user_id: member.userId,
            log_date: today,
            meal_id: mealId,
            option_id: optionId,
            followed: true,
          },
          { onConflict: "user_id,log_date,meal_id" },
        )
      : await supabase
          .from("meal_logs")
          .delete()
          .eq("user_id", member.userId)
          .eq("log_date", today)
          .eq("meal_id", mealId);

    if (error) return { ok: false, message: SAVE_ERROR };
  } catch {
    return { ok: false, message: SAVE_ERROR };
  }

  revalidatePath("/");
  return { ok: true };
}

const waterSchema = z.object({
  ml: z.number().int().min(0).max(6000).multipleOf(250),
});

export async function setWater(input: { ml: number }): Promise<ActionResult> {
  const parsed = waterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: INVALID };

  const member = await getCurrentMember({ required: true });
  const today = todayInSaoPaulo();

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("water_logs")
      .upsert(
        { user_id: member.userId, log_date: today, ml: parsed.data.ml },
        { onConflict: "user_id,log_date" },
      );
    if (error) return { ok: false, message: SAVE_ERROR };
  } catch {
    return { ok: false, message: SAVE_ERROR };
  }

  revalidatePath("/");
  revalidatePath("/agua");
  return { ok: true };
}

/** Persists the theme choice: readable by the root layout on the next request. */
export async function saveTheme(theme: Theme): Promise<void> {
  if (!(THEMES as readonly string[]).includes(theme)) return;
  (await cookies()).set(THEME_COOKIE, parseTheme(theme), {
    maxAge: THEME_MAX_AGE_S,
    sameSite: "lax",
    path: "/",
    // Readable on the client too (the provider reads state from the server, never this cookie).
    httpOnly: false,
  });
}

// ---------------------------------------------------------------------------
// Profile avatar. The browser uploads the (already re-encoded) image straight to the
// private bucket; these actions validate it and keep the database in step with Storage.
// ---------------------------------------------------------------------------

const AVATAR_ERROR = "Não foi possível salvar a foto. Tente de novo.";
const AVATAR_PATH_RE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/\d{10,16}\.(webp|jpg)$/;

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

async function removeObject(supabase: ServerSupabase, path: string | null | undefined) {
  if (!path) return;
  try {
    await supabase.storage.from("avatars").remove([path]);
  } catch {
    // Best effort: a leftover object is harmless (private, in the member's own folder).
  }
}

export async function setAvatar(input: { path: string }): Promise<ActionResult> {
  const parsed = z.object({ path: z.string().max(200) }).safeParse(input);
  if (!parsed.success) return { ok: false, message: AVATAR_ERROR };
  const { path } = parsed.data;

  const member = await getCurrentMember({ required: true });
  const match = AVATAR_PATH_RE.exec(path);
  // The object must live in the member's own folder.
  if (!match || match[1] !== member.userId) return { ok: false, message: AVATAR_ERROR };

  const supabase = await createClient();
  try {
    const { data: exists, error: existsError } = await supabase.storage.from("avatars").exists(path);
    if (existsError || !exists) {
      return { ok: false, message: "A foto não chegou ao servidor. Tente de novo." };
    }

    const { data: current, error: currentError } = await supabase
      .from("members")
      .select("avatar_path")
      .eq("user_id", member.userId)
      .maybeSingle();
    if (currentError) {
      await removeObject(supabase, path);
      return { ok: false, message: AVATAR_ERROR };
    }
    const previous = (current as { avatar_path: string | null } | null)?.avatar_path ?? null;

    const { data: updated, error } = await supabase
      .from("members")
      .update({ avatar_path: path })
      .eq("user_id", member.userId)
      .select("user_id");
    if (error || !updated || updated.length === 0) {
      // No half state: the just-uploaded object must not stay orphaned.
      await removeObject(supabase, path);
      return { ok: false, message: AVATAR_ERROR };
    }

    if (previous && previous !== path) await removeObject(supabase, previous);
  } catch {
    await removeObject(supabase, path);
    return { ok: false, message: AVATAR_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAvatar(): Promise<ActionResult> {
  const member = await getCurrentMember({ required: true });
  const supabase = await createClient();

  try {
    const { data: current, error: currentError } = await supabase
      .from("members")
      .select("avatar_path")
      .eq("user_id", member.userId)
      .maybeSingle();
    if (currentError) return { ok: false, message: "Não foi possível remover a foto. Tente de novo." };
    const previous = (current as { avatar_path: string | null } | null)?.avatar_path ?? null;

    const { error } = await supabase
      .from("members")
      .update({ avatar_path: null })
      .eq("user_id", member.userId);
    if (error) return { ok: false, message: "Não foi possível remover a foto. Tente de novo." };

    await removeObject(supabase, previous);
  } catch {
    return { ok: false, message: "Não foi possível remover a foto. Tente de novo." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
