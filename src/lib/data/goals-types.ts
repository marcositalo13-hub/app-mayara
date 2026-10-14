// Shapes for the Metas > goals section. Client-safe (types only).
import type {
  DayRecord,
  FeedbackMessage,
  MonthCalendar,
  WeekInfo,
  WeekSummary,
} from "@/lib/metrics";

export type GoalsTab = "dia" | "semana" | "mes";

export type GoalsData = {
  today: string;
  todayRecord: DayRecord;
  /** Current cycle week; null outside a cycle. */
  week: { info: WeekInfo; days: DayRecord[]; summary: WeekSummary } | null;
  month: {
    /** 'YYYY-MM' */
    key: string;
    calendar: MonthCalendar;
    /** Every date of the month (for the day sheet). */
    days: Record<string, DayRecord>;
    prevKey: string | null;
    nextKey: string | null;
  };
  streak: number;
  feedback: FeedbackMessage[];
};
