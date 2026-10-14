"use server";

// Dev-only stand-in for saveMeasurement: validates like the real one, writes nothing.
import { WAIST_RANGE, WEIGHT_RANGE } from "@/lib/body/format";
import type { MeasurementResult } from "@/lib/data/body-types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function mockSaveMeasurement(
  fail: boolean,
  input: { measuredOn: string; weightKg?: number | null; waistCm?: number | null },
): Promise<MeasurementResult> {
  if (process.env.NODE_ENV !== "development") throw new Error("Not available");
  await sleep(400);
  if (fail) return { ok: false, message: "Não foi possível salvar. Tente de novo." };
  const { weightKg = null, waistCm = null } = input;
  if (weightKg === null && waistCm === null) return { ok: false, message: "Informe o peso ou a cintura." };
  if (weightKg !== null && (weightKg < WEIGHT_RANGE.min || weightKg > WEIGHT_RANGE.max)) {
    return { ok: false, message: `O peso deve ficar entre ${WEIGHT_RANGE.min} e ${WEIGHT_RANGE.max} kg.` };
  }
  if (waistCm !== null && (waistCm < WAIST_RANGE.min || waistCm > WAIST_RANGE.max)) {
    return { ok: false, message: `A cintura deve ficar entre ${WAIST_RANGE.min} e ${WAIST_RANGE.max} cm.` };
  }
  return { ok: true };
}
