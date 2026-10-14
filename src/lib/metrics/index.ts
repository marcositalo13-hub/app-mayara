// Single source of truth for every derived metric (screens and the future assistant call these).
// Pure functions only: no I/O, no clock — "today" is always passed in.
export * from "./types";
export { buildDayRecord, dayStatus } from "./day-status";
export { WORKOUTS_PER_WEEK, weekSummary } from "./week-summary";
export { daysInMonth, monthCalendar, monthKey, shiftMonth } from "./calendar";
export { streak } from "./streak";
export { feedback, MAX_FEEDBACK } from "./feedback";
