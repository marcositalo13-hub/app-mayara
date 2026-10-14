export const APP_TIME_ZONE = "America/Sao_Paulo";

/** Today's date in São Paulo as 'YYYY-MM-DD'. Call on the server only (writes trust this, never the client clock). */
export function todayInSaoPaulo(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** 'YYYY-MM-DD' → a Date at noon UTC, which is the same calendar day in São Paulo. */
function fromIsoDate(date: string): Date {
  return new Date(`${date}T12:00:00Z`);
}

/** e.g. "terça-feira, 13 de outubro" */
export function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fromIsoDate(date));
}

/** e.g. "9 de novembro" */
export function formatDayMonth(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    day: "numeric",
    month: "long",
  }).format(fromIsoDate(date));
}

/** Postgres `time` ("09:00:00") → "09:00". */
export function formatTimeHint(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

/** '2026-10-14' + (-6) → '2026-10-08' (calendar arithmetic, no time zone drift). */
export function addDays(date: string, days: number): string {
  const d = fromIsoDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** e.g. "T" for terça-feira */
export function formatWeekdayNarrow(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TIME_ZONE, weekday: "narrow" })
    .format(fromIsoDate(date))
    .toUpperCase();
}

/** e.g. "terça, 13/10" */
export function formatWeekdayShortDate(date: string): string {
  const d = fromIsoDate(date);
  const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TIME_ZONE, weekday: "long" })
    .format(d)
    .replace("-feira", "");
  const dm = new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TIME_ZONE, day: "2-digit", month: "2-digit" }).format(d);
  return `${weekday}, ${dm}`;
}

/** Whole calendar days from `from` to `to` ('YYYY-MM-DD'); negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((fromIsoDate(to).getTime() - fromIsoDate(from).getTime()) / 86_400_000);
}

/** '2026-10-13' → "13/10" */
export function formatDayMonthShort(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

/** '2026-10-12' → days since 1970-01-01 (a plain number for chart x-axes). */
export function toDayNumber(date: string): number {
  return Math.floor(fromIsoDate(date).getTime() / 86_400_000);
}

/** Inverse of toDayNumber. */
export function fromDayNumber(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

/** e.g. "seg 12/10" */
export function formatWeekdayAbbrDate(date: string): string {
  const d = fromIsoDate(date);
  const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: APP_TIME_ZONE, weekday: "short" })
    .format(d)
    .replace(".", "");
  return `${weekday} ${formatDayMonthShort(date)}`;
}
