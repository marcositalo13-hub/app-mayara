"use client";

import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { TodaySwapGroup } from "@/lib/data/today-types";

export function SwapsSheet({ groups }: { groups: TodaySwapGroup[] }) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="secondary" size="sm" />}>
        <ArrowLeftRight data-icon="inline-start" />
        Trocas
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Trocas</SheetTitle>
          <SheetDescription>Substitua um alimento por outro da mesma lista.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <ul className="flex flex-col gap-5">
            {groups.map((group) => (
              <li key={group.id} className="flex flex-col gap-2">
                <div>
                  <h3 className="text-lg [overflow-wrap:anywhere]">{group.name}</h3>
                  <p className="text-text-muted [overflow-wrap:anywhere]">
                    Base: {group.base_portion}
                  </p>
                </div>
                <ul className="flex flex-col divide-y divide-border rounded-md bg-surface-alt px-4">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-baseline justify-between gap-x-3 py-3"
                    >
                      <span className="min-w-0 font-bold [overflow-wrap:anywhere]">{item.food}</span>
                      <span className="text-text-muted [overflow-wrap:anywhere]">{item.portion}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
