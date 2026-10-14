import type { FeedbackContext, FeedbackMessage } from "./types";

export const MAX_FEEDBACK = 3;

const kg = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * Rule-based messages, deterministic and ordered by priority (the order below), capped at 3.
 * Tone is supportive by design: nothing here ever suggests skipping meals, eating less to
 * compensate, or exercising to "burn" food.
 */
export function feedback(ctx: FeedbackContext): FeedbackMessage[] {
  const out: FeedbackMessage[] = [];
  const week = ctx.week;

  // 1. Streak of good days.
  if (ctx.streak >= 3) {
    out.push({
      id: "streak",
      tone: "celebrate",
      text: `${ctx.streak} dias bons seguidos. É esse ritmo que muda o corpo.`,
    });
  }

  if (week) {
    // 2. / 3. Workouts of the week.
    if (week.workoutsDone >= week.workoutsTarget) {
      out.push({
        id: "workouts-complete",
        tone: "celebrate",
        text: `Semana de treino completa: ${week.workoutsTarget} de ${week.workoutsTarget}!`,
      });
    } else if (week.remainingDays > 0) {
      const missing = week.workoutsTarget - week.workoutsDone;
      out.push({
        id: "workouts-remaining",
        tone: "nudge",
        text:
          `${plural(missing, "Falta", "Faltam")} ${missing} ${plural(missing, "treino", "treinos")} para fechar a semana, ` +
          `e ainda ${plural(week.remainingDays, "resta", "restam")} ${week.remainingDays} ${plural(week.remainingDays, "dia", "dias")}.`,
      });
    }

    // 4. Cardio target reached.
    if (week.cardioTarget > 0 && week.cardioMinutes >= week.cardioTarget) {
      out.push({
        id: "cardio-done",
        tone: "celebrate",
        text: `Meta de cardio da semana batida: ${week.cardioMinutes} min.`,
      });
    }
  }

  // 5. Water below target on ≥ 3 of the last 4 closed days (days without any log don't count as below).
  const last4 = ctx.closedDays.slice(-4);
  if (last4.length === 4) {
    const below = last4.filter((d) => d.hasAnyLog && d.waterTarget !== null && d.waterMl < d.waterTarget).length;
    if (below >= 3) {
      out.push({
        id: "water-low",
        tone: "nudge",
        text: `A água ficou abaixo da meta em ${below} dos últimos 4 dias. Um copo a cada mamada ajuda.`,
      });
    }
  }

  // 6. Most-missed meal in the last 7 closed days (only days with some log; ties → plan order).
  const order = new Map<string, number>();
  const misses = new Map<string, number>();
  for (const day of ctx.closedDays.slice(-7)) {
    day.meals.forEach((m, i) => {
      if (!order.has(m.name)) order.set(m.name, i);
      if (day.hasAnyLog && m.followed !== true) misses.set(m.name, (misses.get(m.name) ?? 0) + 1);
    });
  }
  const [mostMissed] = [...misses.entries()].sort(
    (a, b) => b[1] - a[1] || (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0),
  );
  if (mostMissed && mostMissed[1] >= 3) {
    const [meal] = mostMissed;
    out.push({
      id: "meal-missed",
      tone: "nudge",
      text:
        `${meal} foi a refeição mais pulada da semana.` +
        (meal === "Lanche da tarde" ? " Ele segura a fome da noite." : ""),
    });
  }

  // 7. Yesterday off plan.
  if (ctx.yesterday === "fora") {
    out.push({
      id: "yesterday-off",
      tone: "info",
      text: "Ontem fugiu do plano, e tudo bem. O que conta é a próxima refeição.",
    });
  }

  // 8. / 9. Weekly weight average vs the previous week (compared at the displayed precision).
  if (week && week.weightAvg !== null && week.weightAvgPrevWeek !== null) {
    const drop = Math.round((week.weightAvgPrevWeek - week.weightAvg) * 10) / 10;
    if (drop > 0) {
      out.push({
        id: "weight-down",
        tone: "celebrate",
        text: `Sua média de peso caiu ${kg(drop)} kg em relação à semana passada.`,
      });
    } else if (drop < 0) {
      out.push({
        id: "weight-up",
        tone: "info",
        text: "O peso oscila de uma semana para outra. Olhe a cintura e a média das próximas semanas.",
      });
    }
  }

  return out.slice(0, MAX_FEEDBACK);
}
