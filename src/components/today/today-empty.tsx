import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type TodayEmptyProps = {
  /** Already formatted, e.g. "9 de novembro". */
  lastCycleEnd: string | null;
  startsOn: string | null;
};

export function TodayEmpty({ lastCycleEnd, startsOn }: TodayEmptyProps) {
  const message = startsOn
    ? `Seu plano começa em ${startsOn}.`
    : lastCycleEnd
      ? `Seu ciclo terminou em ${lastCycleEnd}. O novo plano chega em breve.`
      : "O novo plano chega em breve.";

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <Heart className="size-10 fill-primary-soft text-primary" aria-hidden />
        <p className="text-lg font-bold text-balance">{message}</p>
      </CardContent>
    </Card>
  );
}
