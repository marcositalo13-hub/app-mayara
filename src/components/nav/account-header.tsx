"use client";

import { useState, useTransition } from "react";
import { Ellipsis, LogOut, UserRound } from "lucide-react";
import { Avatar } from "@/components/profile/avatar";
import { ProfileSheet, type ProfileActions } from "@/components/profile/profile-sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AvatarUploader } from "@/lib/avatar/upload";

type AccountHeaderProps = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  dateLabel: string;
  weekLabel: string | null;
  isAdmin: boolean;
  actions: ProfileActions;
  /** Injectable for the dev preview. */
  uploader?: AvatarUploader;
};

export function AccountHeader({
  userId,
  displayName,
  avatarUrl,
  dateLabel,
  weekLabel,
  isAdmin,
  actions,
  uploader,
}: AccountHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  return (
    <header className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-label="Abrir perfil"
          className="pressable -m-0.5 shrink-0 rounded-full p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Avatar displayName={displayName} src={avatarUrl} size="md" />
        </button>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-2xl leading-tight font-extrabold [overflow-wrap:anywhere]">Oi, {displayName}</p>
          <p className="text-text-muted first-letter:uppercase">{dateLabel}</p>
          {weekLabel && <p className="font-bold text-primary">{weekLabel}</p>}
          {isAdmin && <p className="text-text-muted">Você está como administrador</p>}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" aria-label="Abrir menu da conta" className="shrink-0" />}
        >
          <Ellipsis className="size-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setProfileOpen(true)}>
            <UserRound />
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem disabled={signingOut} onClick={() => startSignOut(() => actions.signOut())}>
            <LogOut />
            {signingOut ? "Saindo..." : "Sair"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileSheet
        open={profileOpen}
        onOpenChange={setProfileOpen}
        userId={userId}
        displayName={displayName}
        avatarUrl={avatarUrl}
        actions={actions}
        uploader={uploader}
      />
    </header>
  );
}
