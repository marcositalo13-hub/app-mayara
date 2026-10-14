import type { DayStatus } from "@/lib/metrics";

// Neutral by design: no status is ever red. "Fora do plano" is just a softer, outlined circle.

export const STATUS_LABEL: Record<DayStatus, string> = {
  bom: "Dia bom",
  ok: "Dia ok",
  fora: "Fora do plano",
  sem_registro: "Sem registro",
  em_andamento: "Em andamento",
  futuro: "Ainda não chegou",
};

/** Circle look of a day (calendar, week dots, badges). */
export const STATUS_CIRCLE: Record<DayStatus, string> = {
  bom: "bg-primary text-primary-foreground",
  ok: "bg-primary-soft text-text",
  // Outline in a muted tone: --border alone is too faint to tell "fora" from "ok" in light mode.
  fora: "bg-surface-alt text-text ring-1 ring-inset ring-text-muted/50",
  sem_registro: "border-2 border-dashed border-text-muted/40 text-text-muted",
  em_andamento: "border-2 border-primary/60 text-text",
  futuro: "text-text-muted/60",
};

/** Calendar legend (short labels). */
export const LEGEND: { status: DayStatus; label: string }[] = [
  { status: "bom", label: "Bom" },
  { status: "ok", label: "Ok" },
  { status: "fora", label: "Fora do plano" },
  { status: "sem_registro", label: "Sem registro" },
];
