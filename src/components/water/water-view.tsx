"use client";

import { Check, Minus, Plus } from "lucide-react";
import { CUP_ML, formatLiters, WaterTracker } from "@/components/cute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWaterLog, WATER_MAX_ML } from "@/hooks/use-water-log";
import type { ActionResult } from "@/lib/data/today-types";
import type { WaterData } from "@/lib/data/water";
import { WaterBottle } from "./water-bottle";
import { WaterHistory } from "./water-history";

type WaterViewProps = {
  data: Extract<WaterData, { status: "ok" }>;
  setWater: (input: { ml: number }) => Promise<ActionResult>;
};

const formatMl = (ml: number) => ml.toLocaleString("pt-BR");

export function WaterView({ data, setWater }: WaterViewProps) {
  const { goalMl } = data;
  const { waterMl, setMl, addMl } = useWaterLog({
    serverMl: data.waterMl,
    goalMl,
    today: data.today,
    setWater,
  });

  const cups = Math.max(1, Math.round(goalMl / CUP_ML));
  const remaining = Math.max(0, goalMl - waterMl);
  const reached = waterMl >= goalMl;
  // Today's bar follows the live value.
  const days = data.days.map((d) =>
    d.isToday ? { ...d, ml: waterMl === 0 && d.ml === null ? null : waterMl } : d,
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">Água</h1>

      <Card>
        <CardContent className="flex flex-col items-center gap-5">
          <WaterBottle
            fraction={goalMl > 0 ? waterMl / goalMl : 0}
            label={`Garrafa com ${formatLiters(waterMl)} L de ${formatLiters(goalMl)} L`}
          />
          <div className="flex flex-col items-center gap-1 text-center" aria-live="polite">
            <p className="text-3xl font-extrabold tabular-nums">
              {formatLiters(waterMl)} L <span className="text-xl text-text-muted">de {formatLiters(goalMl)} L</span>
            </p>
            {reached ? (
              <p className="inline-flex items-center gap-1.5 font-bold text-success">
                <Check aria-hidden className="size-5" />
                Meta do dia batida
              </p>
            ) : (
              <p className="text-text-muted tabular-nums">faltam {formatMl(remaining)} mL</p>
            )}
          </div>

          <div className="grid w-full grid-cols-2 gap-2">
            <Button size="lg" onClick={() => addMl(250)} disabled={waterMl >= WATER_MAX_ML}>
              <Plus data-icon="inline-start" />
              250 mL
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => addMl(500)}
              disabled={waterMl >= WATER_MAX_ML}
            >
              <Plus data-icon="inline-start" />
              500 mL
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => addMl(-250)} disabled={waterMl <= 0}>
            <Minus data-icon="inline-start" />
            250 mL
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-xl">Copos de 250 mL</h2>
          <WaterTracker
            cups={cups}
            filled={Math.min(cups, Math.round(waterMl / CUP_ML))}
            onChange={(filled) => setMl(filled * CUP_ML)}
            showLabel={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <h2 className="text-xl">Últimos 7 dias</h2>
          <WaterHistory days={days} fallbackGoalMl={goalMl} />
        </CardContent>
      </Card>
    </div>
  );
}
