"use client";

// Dev-only: the real header + profile sheet, with a fake uploader and fake actions so
// every failure mode of the avatar flow can be exercised without touching Supabase.
import { useMemo } from "react";
import { AccountHeader } from "@/components/nav/account-header";
import { ThemeProvider } from "@/components/theme/theme-provider";
import type { AvatarUploader } from "@/lib/avatar/upload";


const noopPersist = async () => {};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type DevMode = "ok" | "slow" | "upload-fails" | "save-fails" | "no-avatar-start";

export function DevProfile({
  mode,
  displayName,
  realTheme = false,
}: {
  mode: DevMode;
  displayName: string;
  /** Use the real saveTheme server action (sets the cookie) instead of a no-op. */
  realTheme?: boolean;
}) {
  const slow = mode === "slow";

  // Everything the fake remembers lives in this closure.
  const sim = useMemo(() => {
    const state = { url: null as string | null, uploaded: [] as string[], removed: [] as string[] };

    const uploader: AvatarUploader = {
      async upload(_userId, avatar) {
        await sleep(slow ? 4000 : 600);
        if (mode === "upload-fails") return { ok: false };
        const path = `dev/${Date.now()}.${avatar.extension}`;
        state.uploaded.push(path);
        // Keep the processed blob visible so its size/type can be inspected.
        (window as unknown as { __lastAvatar?: unknown }).__lastAvatar = {
          type: avatar.blob.type,
          size: avatar.blob.size,
          path,
        };
        return { ok: true, path };
      },
      async remove(path) {
        state.removed.push(path);
        (window as unknown as { __removed?: string[] }).__removed = state.removed;
      },
    };

    const actions = {
      async setAvatar() {
        await sleep(slow ? 2500 : 300);
        if (mode === "save-fails") {
          return { ok: false as const, message: "Não foi possível salvar a foto. Tente de novo." };
        }
        return { ok: true as const };
      },
      async removeAvatar() {
        await sleep(300);
        return { ok: true as const };
      },
      async signOut() {},
    };
    return { uploader, actions };
  }, [mode, slow]);

  return (
    <ThemeProvider persist={realTheme ? undefined : noopPersist}>
      <AccountHeader
        userId="00000000-0000-4000-8000-000000000001"
        displayName={displayName}
        avatarUrl={null}
        dateLabel="quarta-feira, 14 de outubro"
        weekLabel="Semana 1 de 4"
        isAdmin={false}
        actions={sim.actions}
        uploader={sim.uploader}
      />
    </ThemeProvider>
  );
}
