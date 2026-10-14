"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentMember } from "@/lib/auth";
import type { MeasurementResult } from "@/lib/data/body-types";
import { addDays, todayInSaoPaulo } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { WAIST_RANGE, WEIGHT_RANGE } from "@/lib/body/format";

const SAVE_ERROR = "Não foi possível salvar. Tente de novo.";
const MAX_DAYS_BACK = 7;

/** True when `value` is a multiple of `step` (tolerant to float noise). */
const isMultiple = (value: number, step: number) => {
  const q = value / step;
  return Math.abs(q - Math.round(q)) < 1e-6;
};

const schema = z.object({
  measuredOn: z.iso.date(),
  weightKg: z.number().min(WEIGHT_RANGE.min).max(WEIGHT_RANGE.max).nullish(),
  waistCm: z.number().min(WAIST_RANGE.min).max(WAIST_RANGE.max).nullish(),
});

export async function saveMeasurement(input: {
  measuredOn: string;
  weightKg?: number | null;
  waistCm?: number | null;
}): Promise<MeasurementResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const fields = new Set(parsed.error.issues.map((i) => String(i.path[0])));
    if (fields.has("weightKg")) {
      return { ok: false, message: `O peso deve ficar entre ${WEIGHT_RANGE.min} e ${WEIGHT_RANGE.max} kg.` };
    }
    if (fields.has("waistCm")) {
      return { ok: false, message: `A cintura deve ficar entre ${WAIST_RANGE.min} e ${WAIST_RANGE.max} cm.` };
    }
    return { ok: false, message: "Não foi possível salvar: dados inválidos." };
  }
  const { measuredOn } = parsed.data;
  const weightKg = parsed.data.weightKg ?? null;
  const waistCm = parsed.data.waistCm ?? null;

  if (weightKg === null && waistCm === null) {
    return { ok: false, message: "Informe o peso ou a cintura." };
  }
  if (weightKg !== null && !isMultiple(weightKg, 0.1)) {
    return { ok: false, message: "Use no máximo uma casa decimal no peso." };
  }
  if (waistCm !== null && !isMultiple(waistCm, 0.5)) {
    return { ok: false, message: "A cintura aceita números inteiros ou com 0,5 (ex.: 80 ou 80,5)." };
  }

  // The server decides what "today" is; the date may be today or up to 7 days back.
  const today = todayInSaoPaulo();
  if (measuredOn > today) return { ok: false, message: "Não dá para registrar uma data futura." };
  if (measuredOn < addDays(today, -MAX_DAYS_BACK)) {
    return { ok: false, message: "Você pode registrar até 7 dias atrás." };
  }

  const member = await getCurrentMember({ required: true });
  try {
    const supabase = await createClient();
    // Only the provided fields are sent: on conflict, the other column keeps its value.
    const row: Record<string, string | number> = {
      user_id: member.userId,
      measured_on: measuredOn,
    };
    if (weightKg !== null) row.weight_kg = weightKg;
    if (waistCm !== null) row.waist_cm = waistCm;

    const { error } = await supabase
      .from("body_measurements")
      .upsert(row, { onConflict: "user_id,measured_on" });
    if (error) return { ok: false, message: SAVE_ERROR };
  } catch {
    return { ok: false, message: SAVE_ERROR };
  }

  revalidatePath("/metas");
  return { ok: true };
}
