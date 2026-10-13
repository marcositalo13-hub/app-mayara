"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CheckButton } from "@/components/cute";
import { formatTimeHint } from "@/lib/date";
import type { TodayMeal, TodayOption } from "@/lib/data/today-types";
import { cn } from "@/lib/utils";

const kcalLabel = (kcal: number | null) =>
  kcal === null ? null : `${kcal.toLocaleString("pt-BR")} kcal`;

type MealCardProps = {
  meal: TodayMeal;
  done: boolean;
  selectedOptionId: string;
  onToggleDone: (done: boolean) => void;
  onSelectOption: (optionId: string) => void;
};

export function MealCard({ meal, done, selectedOptionId, onToggleDone, onSelectOption }: MealCardProps) {
  const [open, setOpen] = useState(false);
  const regionId = useId();
  const option = meal.options.find((o) => o.id === selectedOptionId) ?? meal.options[0];
  const time = formatTimeHint(meal.time_hint);
  const summary = [option.label, kcalLabel(option.kcal)].filter(Boolean).join(" · ");

  return (
    <article
      data-done={done}
      className="rounded-xl bg-surface shadow-soft ring-1 ring-border transition-[background-color] duration-200 data-[done=true]:bg-primary-soft/40"
    >
      <div className="flex items-start gap-2 p-4">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-12 min-w-0 flex-1 items-start gap-2 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            {time && <span className="text-text-muted tabular-nums">{time}</span>}
            <span className="text-lg leading-snug font-extrabold [overflow-wrap:anywhere]">
              {meal.name}
            </span>
            <span className="text-text-muted [overflow-wrap:anywhere]">{summary}</span>
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "mt-1 size-5 shrink-0 text-text-muted transition-transform duration-250 ease-(--ease-out)",
              open && "rotate-180",
            )}
          />
        </button>
        <CheckButton
          checked={done}
          onCheckedChange={onToggleDone}
          label={`${meal.name}: marcar como feita`}
        />
      </div>

      <div className="expand" data-open={open} id={regionId} inert={!open}>
        <div>
          <div className="flex flex-col gap-4 px-4 pb-5">
            {meal.note && (
              <p className="rounded-md bg-accent-soft px-4 py-3 text-accent">{meal.note}</p>
            )}
            {meal.options.length > 1 && (
              <OptionPicker
                options={meal.options}
                selectedId={option.id}
                onSelect={onSelectOption}
                label={`Opções de ${meal.name}`}
              />
            )}
            <OptionDetails option={option} />
          </div>
        </div>
      </div>
    </article>
  );
}

function OptionPicker({
  options,
  selectedId,
  onSelect,
  label,
}: {
  options: TodayOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  label: string;
}) {
  // Side-by-side segments only when they fit; many or long labels stack as a list.
  const stacked = options.length > 3 || options.some((o) => o.label.length > 16);

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-lg bg-surface-alt p-1"
      style={{
        gridTemplateColumns: stacked ? "minmax(0, 1fr)" : `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((o) => {
        const selected = o.id === selectedId;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(o.id)}
            className={cn(
              "pressable min-h-12 rounded-md py-2 leading-tight font-bold [overflow-wrap:anywhere] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              stacked ? "px-4 text-left" : "px-2 text-center text-balance",
              selected ? "bg-surface text-primary shadow-soft" : "text-text-muted",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function OptionDetails({ option }: { option: TodayOption }) {
  return (
    <div className="flex flex-col gap-3">
      {option.items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {option.items.map((item) => (
            <li key={item.id} className="flex gap-2">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {item.food}
                {item.quantity && <span className="text-text-muted"> — {item.quantity}</span>}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted">Sem itens cadastrados para esta opção.</p>
      )}
      {option.note && <p className="text-text-muted">{option.note}</p>}
      {option.max_per_week !== null && (
        <p className="font-bold text-accent">Até {option.max_per_week}x por semana</p>
      )}
    </div>
  );
}
