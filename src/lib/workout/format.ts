// Pure helpers for the workout screens (client- and server-safe).
import type { RepsUnit } from "@/lib/types/db";
import type { LoggedSet, Suggestion } from "@/lib/data/workout-types";

export const NO_HISTORY_HINT = "Escolha uma carga que deixe 2 repetições sobrando.";

/** 22.5 → "22,5" */
export const formatKg = (kg: number) =>
  kg.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

const unitSuffix = (unit: RepsUnit) => (unit === "s" ? " s" : unit === "passos" ? " passos" : "");

/** "3 × 10–12", "3 × 8 cada lado", "3 × 20–30 s cada lado" */
export function formatTarget(t: {
  sets: number;
  reps_min: number;
  reps_max: number;
  reps_unit: RepsUnit;
  per_side: boolean;
}): string {
  const reps = t.reps_min === t.reps_max ? `${t.reps_min}` : `${t.reps_min}–${t.reps_max}`;
  return `${t.sets} × ${reps}${unitSuffix(t.reps_unit)}${t.per_side ? " cada lado" : ""}`;
}

/** 45 → "45 s", 120 → "2 min", 90 → "1 min 30 s" */
export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m} min ${s} s`;
}

/** 83 → "1:23" */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** "20 kg × 12, 12, 11" or "20 kg × 12, 22,5 kg × 10" or "30 s, 30 s" */
export function formatLastPerformance(sets: LoggedSet[], unit: RepsUnit, withLoad: boolean): string {
  const ordered = [...sets].sort((a, b) => a.set_no - b.set_no);
  const repsText = (r: number) => (unit === "s" ? `${r} s` : `${r}`);
  if (!withLoad) return ordered.map((s) => repsText(s.reps)).join(", ");

  const groups: { load: number; reps: number[] }[] = [];
  for (const s of ordered) {
    const last = groups[groups.length - 1];
    if (last && last.load === s.load_kg) last.reps.push(s.reps);
    else groups.push({ load: s.load_kg, reps: [s.reps] });
  }
  return groups.map((g) => `${formatKg(g.load)} kg × ${g.reps.map(repsText).join(", ")}`).join(", ");
}

/**
 * Next-session suggestion, derived from the last finished session (never stored).
 *
 * Only the planned sets (set_no 1..sets) of the last session are judged; extra sets don't count.
 * "Hit the top" = all planned sets were logged and every one reached reps_max.
 *
 * - No history → null (UI shows NO_HISTORY_HINT).
 * - increment_kg > 0:
 *     hit the top → "Subir para X kg", X = highest load of the last session + increment_kg
 *     otherwise   → "Manter X kg",     X = most-used load of the last session (tie → higher)
 * - increment_kg = 0 (bodyweight/time):
 *     hit the top → "Tente +1 repetição" ("Tente +5 s" for seconds, "Tente +1 passo" for steps)
 *     otherwise   → "Mesma meta da última vez"
 */
export function computeSuggestion(
  last: LoggedSet[] | null,
  plan: { sets: number; reps_max: number; reps_unit: RepsUnit; increment_kg: number },
): Suggestion | null {
  if (!last || last.length === 0) return null;

  const planned = last.filter((s) => s.set_no >= 1 && s.set_no <= plan.sets);
  const hitTop =
    planned.length >= plan.sets && planned.every((s) => s.reps >= plan.reps_max);

  if (plan.increment_kg > 0) {
    if (hitTop) {
      const next = Math.max(...last.map((s) => s.load_kg)) + plan.increment_kg;
      return { label: `Subir para ${formatKg(next)} kg`, suggestedLoad: next };
    }
    const keep = mostUsedLoad(last);
    return { label: `Manter ${formatKg(keep)} kg`, suggestedLoad: keep };
  }

  if (hitTop) {
    const label =
      plan.reps_unit === "s" ? "Tente +5 s" : plan.reps_unit === "passos" ? "Tente +1 passo" : "Tente +1 repetição";
    return { label, suggestedLoad: null };
  }
  return { label: "Mesma meta da última vez", suggestedLoad: null };
}

function mostUsedLoad(sets: LoggedSet[]): number {
  const counts = new Map<number, number>();
  for (const s of sets) counts.set(s.load_kg, (counts.get(s.load_kg) ?? 0) + 1);
  let best = sets[0].load_kg;
  let bestCount = 0;
  for (const [load, count] of counts) {
    if (count > bestCount || (count === bestCount && load > best)) {
      best = load;
      bestCount = count;
    }
  }
  return best;
}

export const CARDIO_MODALITIES = ["escada", "caminhada", "bicicleta", "eliptico"] as const;
export type CardioModality = (typeof CARDIO_MODALITIES)[number];
export const CARDIO_MODALITY_LABELS: Record<CardioModality, string> = {
  escada: "Escada",
  caminhada: "Caminhada",
  bicicleta: "Bicicleta",
  eliptico: "Elíptico",
};

/** Perceived exertion (PSE) labels, 1–10. */
export function rpeLabel(rpe: number): string {
  if (rpe <= 1) return "Muito leve";
  if (rpe <= 3) return "Leve";
  if (rpe <= 6) return "Moderada";
  if (rpe <= 8) return "Vigorosa: dá para falar uma frase";
  if (rpe === 9) return "Muito difícil";
  return "Esforço máximo";
}
