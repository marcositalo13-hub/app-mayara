"use client";

import { CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { formatBody } from "@/lib/body/format";
import { formatDayMonthShort, formatWeekdayShortDate, fromDayNumber } from "@/lib/date";

export type ChartPoint = {
  /** Days since 1970 (a numeric x-axis keeps daily dots and weekly points aligned in time). */
  x: number;
  daily?: number;
  weekly?: number;
  /** Monday of the week the weekly average belongs to ('YYYY-MM-DD'). */
  weekStart?: string;
};

type BodyChartProps = {
  data: ChartPoint[];
  unit: "kg" | "cm";
  /** Plain-language description for screen readers (the SVG itself is hidden from them). */
  summary: string;
  compact?: boolean;
};

const config = {
  weekly: { label: "Média da semana", color: "var(--primary)" },
  daily: { label: "Registro do dia", color: "var(--primary-soft)" },
} satisfies ChartConfig;

/** Y domain from the data: min−1 .. max+1, never from zero. */
export function yDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 1];
  return [Math.floor(Math.min(...values) - 1), Math.ceil(Math.max(...values) + 1)];
}

function ticksFor(min: number, max: number, count: number): number[] {
  if (max <= min) return [min];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(min + step * i));
}

function BodyTooltip({
  active,
  payload,
  unit,
}: {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as ChartPoint | undefined;
  if (!point) return null;
  const date = fromDayNumber(point.x);
  return (
    <div className="rounded-md bg-surface px-3 py-2 text-base text-text shadow-soft ring-1 ring-border">
      <p className="font-bold">{formatWeekdayShortDate(date)}</p>
      {point.daily !== undefined && (
        <p className="tabular-nums">
          Registro: <span className="font-bold">{formatBody(point.daily)} {unit}</span>
        </p>
      )}
      {point.weekly !== undefined && point.weekStart && (
        <p className="tabular-nums text-primary">
          Média da semana de {formatDayMonthShort(point.weekStart)}:{" "}
          <span className="font-bold">{formatBody(point.weekly)} {unit}</span>
        </p>
      )}
    </div>
  );
}

export function BodyChart({ data, unit, summary, compact = false }: BodyChartProps) {
  const sorted = [...data].sort((a, b) => a.x - b.x);
  const values = sorted.flatMap((p) => [p.daily, p.weekly]).filter((v): v is number => v !== undefined);
  const [yMin, yMax] = yDomain(values);
  const xMin = sorted[0]?.x ?? 0;
  const xMax = sorted[sorted.length - 1]?.x ?? 1;
  const xPad = xMax === xMin ? 3 : 0;

  return (
    <figure className="m-0">
      <p className="sr-only">{summary}</p>
      <ChartContainer
        config={config}
        aria-hidden
        className={compact ? "aspect-auto h-36 w-full justify-start" : "aspect-auto h-56 w-full justify-start"}
      >
        <ComposedChart data={sorted} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.7} />
          <XAxis
            dataKey="x"
            type="number"
            scale="linear"
            domain={[xMin - xPad, xMax + xPad]}
            ticks={ticksFor(xMin - xPad, xMax + xPad, compact ? 3 : 4)}
            tickFormatter={(v: number) => formatDayMonthShort(fromDayNumber(v))}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={16}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            allowDecimals={false}
            tickFormatter={(v: number) => v.toLocaleString("pt-BR")}
            tickLine={false}
            axisLine={false}
            width={36}
            fontSize={16}
            tickCount={compact ? 3 : 4}
          />
          <Tooltip
            content={(props) => <BodyTooltip active={props.active} payload={props.payload} unit={unit} />}
            cursor={{ stroke: "var(--border)" }}
            isAnimationActive={false}
          />
          {/* Each weighing: small faint dots behind the weekly line. */}
          <Line
            dataKey="daily"
            stroke="none"
            isAnimationActive={false}
            connectNulls={false}
            activeDot={{ r: 5, fill: "var(--primary-soft)", stroke: "var(--primary)" }}
            dot={{ r: 3.5, fill: "var(--primary-soft)", stroke: "var(--primary)", strokeOpacity: 0.4, strokeWidth: 1 }}
          />
          <Line
            dataKey="weekly"
            stroke="var(--primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            connectNulls
            isAnimationActive={false}
            dot={{ r: 4.5, fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--surface)", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ChartContainer>
    </figure>
  );
}
