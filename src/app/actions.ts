"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentMember } from "@/lib/auth";
import type { ActionResult } from "@/lib/data/today-types";
import { todayInSaoPaulo } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";

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
