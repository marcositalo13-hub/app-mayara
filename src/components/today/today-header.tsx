"use client";

import { useTransition } from "react";
import { LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TodayHeaderProps = {
  displayName: string;
  dateLabel: string;
  weekLabel: string | null;
  isAdmin: boolean;
  signOut: () => Promise<void>;
};

export function TodayHeader({ displayName, dateLabel, weekLabel, isAdmin, signOut }: TodayHeaderProps) {
  const [signingOut, startSignOut] = useTransition();

  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <h1 className="text-2xl [overflow-wrap:anywhere]">Oi, {displayName}</h1>
        <p className="text-text-muted first-letter:uppercase">{dateLabel}</p>
        {weekLabel && <p className="font-bold text-primary">{weekLabel}</p>}
        {isAdmin && <p className="text-text-muted">Você está como administrador</p>}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" aria-label="Abrir menu da conta" />}
        >
          <UserRound className="size-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem
            disabled={signingOut}
            onClick={() => startSignOut(() => signOut())}
          >
            <LogOut />
            {signingOut ? "Saindo..." : "Sair"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
