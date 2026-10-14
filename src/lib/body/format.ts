// Pure helpers for the body section (client- and server-safe).

/** 72.46 → "72,5" (always one decimal for body values). */
export const formatBody = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Signed change with a real minus sign: -0.6 → "−0,6", 0.4 → "+0,4", 0 → "0,0".
 * Rounded to one decimal first so "-0.04" doesn't read as a change.
 */
export function formatChange(delta: number): string {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) return formatBody(0);
  return `${rounded < 0 ? "−" : "+"}${formatBody(Math.abs(rounded))}`;
}

export const changeDirection = (delta: number): "down" | "up" | "same" => {
  const rounded = Math.round(delta * 10) / 10;
  return rounded < 0 ? "down" : rounded > 0 ? "up" : "same";
};

/**
 * Parses what a person types: "72,5", "72.5", " 72,50 kg ". Returns null for empty or
 * unreadable text (NaN is never returned).
 */
export function parseDecimal(text: string): number | null {
  const cleaned = text.trim().replace(/\s+/g, "").replace(",", ".").replace(/[^\d.]/g, "");
  if (cleaned === "" || cleaned === ".") return null;
  // Keep only the first dot ("72.5.1" → "72.5").
  const [int, ...rest] = cleaned.split(".");
  const value = Number(rest.length ? `${int}.${rest.join("")}` : int);
  return Number.isFinite(value) ? value : null;
}

export const WEIGHT_RANGE = { min: 30, max: 150 } as const;
export const WAIST_RANGE = { min: 40, max: 150 } as const;

/** Weight is stored with one decimal: 72.456 → 72.5. */
export const roundWeight = (kg: number) => Math.round(kg * 10) / 10;
/** Waist is stored in 0.5 cm steps: 80.3 → 80.5. */
export const roundWaist = (cm: number) => Math.round(cm * 2) / 2;
