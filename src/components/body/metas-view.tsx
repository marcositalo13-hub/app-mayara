"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Minus, Ruler } from "lucide-react";
import { Avatar } from "@/components/profile/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BodyChart, type ChartPoint } from "@/components/body/body-chart";
import { MeasureSheet } from "@/components/body/measure-sheet";
import type { BodyData, LatestValue, MeasurementResult, SaveMeasurementInput } from "@/lib/data/body-types";
import { changeDirection, formatBody, formatChange } from "@/lib/body/format";
import { addDays, formatDayMonth, formatDayMonthShort, toDayNumber } from "@/lib/date";
import { cn } from "@/lib/utils";

type MetasViewProps = {
  data: BodyData;
  displayName: string;
  avatarUrl: string | null;
  /** Goals section (daily/weekly/monthly + feedback), rendered above "Corpo". */
  goals?: React.ReactNode;
  saveMeasurement: (input: SaveMeasurementInput) => Promise<MeasurementResult>;
};

export function MetasView({ data, displayName, avatarUrl, goals, saveMeasurement }: MetasViewProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const weighings = data.daily.filter((d) => d.weightKg !== null);
  const waistEntries = data.daily.filter((d) => d.waistCm !== null);
  const needsWaist = data.daysSinceLastWaist === null || data.daysSinceLastWaist >= 7;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Avatar displayName={displayName} src={avatarUrl} size="md" />
        <h1 className="min-w-0 text-2xl [overflow-wrap:anywhere]">Suas metas, {displayName}</h1>
      </div>

      {goals}

      <section aria-labelledby="body-title" className="flex flex-col gap-4">
        <h2 id="body-title" className="text-xl">
          Corpo
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Peso"
            unit="kg"
            latest={data.latestWeight}
            today={data.today}
            change={data.changeSinceStartKg}
          />
          <StatCard
            title="Cintura"
            unit="cm"
            latest={data.latestWaist}
            today={data.today}
            change={data.changeSinceStartCm}
          />
        </div>

        <Button size="lg" onClick={() => setSheetOpen(true)}>
          <Ruler data-icon="inline-start" />
          Registrar medidas
        </Button>

        {needsWaist && (
          <Card className="bg-accent-soft ring-accent/30">
            <CardContent className="flex flex-col gap-3">
              <p className="text-lg font-extrabold">Que tal medir a cintura hoje?</p>
              <p className="text-text-muted">
                {data.daysSinceLastWaist === null
                  ? "Ainda não há uma medida de cintura registrada."
                  : `Faz ${data.daysSinceLastWaist} dias desde a última medida.`}
              </p>
              <Button variant="secondary" onClick={() => setSheetOpen(true)} className="bg-surface">
                Medir cintura
              </Button>
            </CardContent>
          </Card>
        )}

        <ChartCard
          title="Peso"
          caption="Linha: média da semana. Pontos claros: cada pesagem."
          empty={weighings.length < 2}
          emptyText="O gráfico aparece depois de duas pesagens. Sem pressa: uma vez por semana já ajuda."
        >
          <BodyChart
            unit="kg"
            data={chartPoints(data, "weight")}
            summary={chartSummary(data, "weight")}
          />
        </ChartCard>

        <ChartCard
          title="Cintura"
          caption="Linha: média da semana."
          empty={waistEntries.length < 2}
          emptyText="A linha da cintura aparece depois de duas medidas."
        >
          <BodyChart
            compact
            unit="cm"
            data={chartPoints(data, "waist")}
            summary={chartSummary(data, "waist")}
          />
        </ChartCard>
      </section>

      <MeasureSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        today={data.today}
        daily={data.daily}
        saveMeasurement={saveMeasurement}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function StatCard({
  title,
  unit,
  latest,
  today,
  change,
}: {
  title: string;
  unit: "kg" | "cm";
  latest: LatestValue | null;
  today: string;
  change: number | null;
}) {
  const direction = change === null ? null : changeDirection(change);
  const Icon = direction === "down" ? ArrowDown : direction === "up" ? ArrowUp : Minus;

  return (
    <Card>
      <CardContent className="flex min-w-0 flex-col gap-2">
        <h3 className="text-text-muted">{title}</h3>
        {latest ? (
          <>
            <p className="text-3xl font-extrabold tabular-nums">
              {formatBody(latest.value)} <span className="text-lg text-text-muted">{unit}</span>
            </p>
            <p className="text-text-muted">{latest.date === today ? "hoje" : `em ${formatDayMonth(latest.date)}`}</p>
          </>
        ) : (
          <>
            <p className="text-3xl font-extrabold">—</p>
            <p className="text-text-muted">Ainda sem registro</p>
          </>
        )}
        {change === null ? (
          // With no measurement at all the card already says so; the hint only helps afterwards.
          latest && <p className="text-text-muted">A tendência aparece a partir da 2ª semana.</p>
        ) : (
          <p
            className={cn(
              "flex items-start gap-1.5 font-bold",
              // Neutral by design: a decrease is celebrated, an increase is never red.
              direction === "down" ? "text-success" : "text-text-muted",
            )}
          >
            <Icon aria-hidden className="mt-1 size-4 shrink-0" />
            <span className="tabular-nums">
              {direction === "same"
                ? "Sem mudança desde o início"
                : `${formatChange(change)} ${unit} desde o início`}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  caption,
  empty,
  emptyText,
  children,
}: {
  title: string;
  caption: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <h3 className="text-lg font-extrabold">{title}</h3>
        {empty ? (
          <p className="rounded-md bg-surface-alt px-4 py-5 text-center text-text-muted">{emptyText}</p>
        ) : (
          <>
            {children}
            <p className="text-text-muted">{caption}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

/** Merges daily dots and weekly averages into one x-sorted series. */
function chartPoints(data: BodyData, kind: "weight" | "waist"): ChartPoint[] {
  const byX = new Map<number, ChartPoint>();
  const at = (x: number) => byX.get(x) ?? { x };

  for (const d of data.daily) {
    const value = kind === "weight" ? d.weightKg : d.waistCm;
    if (value === null) continue;
    const x = toDayNumber(d.date);
    byX.set(x, { ...at(x), daily: value });
  }
  for (const w of data.weekly) {
    const value = kind === "weight" ? w.avgWeightKg : w.avgWaistCm;
    if (value === null) continue;
    // Plotted mid-week (Thursday), but never after today.
    const mid = addDays(w.weekStart, 3);
    const x = toDayNumber(mid > data.today ? data.today : mid);
    byX.set(x, { ...at(x), weekly: value, weekStart: w.weekStart });
  }
  return [...byX.values()].sort((a, b) => a.x - b.x);
}

function chartSummary(data: BodyData, kind: "weight" | "waist"): string {
  const unit = kind === "weight" ? "kg" : "cm";
  const weeks = data.weekly
    .filter((w) => (kind === "weight" ? w.avgWeightKg : w.avgWaistCm) !== null)
    .map((w) => {
      const v = (kind === "weight" ? w.avgWeightKg : w.avgWaistCm) as number;
      return `semana de ${formatDayMonthShort(w.weekStart)}: ${formatBody(v)} ${unit}`;
    });
  return `Médias semanais de ${kind === "weight" ? "peso" : "cintura"}: ${weeks.join("; ") || "sem dados"}.`;
}
