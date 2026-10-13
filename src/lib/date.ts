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
