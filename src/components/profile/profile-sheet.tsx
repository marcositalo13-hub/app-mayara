"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/profile/avatar";
import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AvatarError, processAvatar } from "@/lib/avatar/process-image";
import { type AvatarUploader, describeUploadError, storageUploader } from "@/lib/avatar/upload";
import type { ActionResult } from "@/lib/data/today-types";
import { THEME_LABELS, THEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";

export type ProfileActions = {
  setAvatar: (input: { path: string }) => Promise<ActionResult>;
  removeAvatar: () => Promise<ActionResult>;
  signOut: () => Promise<void>;
};

type ProfileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  actions: ProfileActions;
  /** Injectable for the dev preview; production uses the Supabase browser client. */
  uploader?: AvatarUploader;
};

type Busy = null | "processing" | "uploading" | "saving" | "removing";

const BUSY_TEXT: Record<Exclude<Busy, null>, string> = {
  processing: "Preparando a foto...",
  uploading: "Enviando a foto...",
  saving: "Salvando...",
  removing: "Removendo...",
};

const GENERIC_SAVE_ERROR = "Não foi possível salvar a foto. Tente de novo.";

export function ProfileSheet({
  open,
  onOpenChange,
  userId,
  displayName,
  avatarUrl,
  actions,
  uploader = storageUploader,
}: ProfileSheetProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<string[]>([]);

  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [signingOut, startSignOut] = useTransition();

  // When fresh data arrives from the server (after revalidation), drop the local overrides.
  const [seenUrl, setSeenUrl] = useState(avatarUrl);
  if (seenUrl !== avatarUrl) {
    setSeenUrl(avatarUrl);
    setRemoved(false);
    setPreview(null);
  }

  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const shown = preview ?? (removed ? null : avatarUrl);
  const hasPhoto = !!shown;
  const working = busy !== null;

  async function onFile(file: File) {
    setError(null);
    setBusy("processing");

    let processed;
    try {
      processed = await processAvatar(file);
    } catch (e) {
      setError(e instanceof AvatarError ? e.message : "Não foi possível ler esta imagem. Tente outra foto.");
      setBusy(null);
      return;
    }

    // Show the new photo right away while it uploads.
    const url = URL.createObjectURL(processed.blob);
    objectUrls.current.push(url);
    setPreview(url);
    setRemoved(false);

    setBusy("uploading");
    const uploaded = await uploader.upload(userId, processed);
    if (!uploaded.ok) {
      setPreview(null);
      setError(describeUploadError(uploaded.error));
      setBusy(null);
      return;
    }

    setBusy("saving");
    let result: ActionResult;
    try {
      result = await actions.setAvatar({ path: uploaded.path });
    } catch {
      result = { ok: false, message: GENERIC_SAVE_ERROR };
    }
    if (!result.ok) {
      // Nothing half-saved: the uploaded object goes away and the old photo comes back.
      await uploader.remove(uploaded.path);
      setPreview(null);
      setError(result.message);
      setBusy(null);
      return;
    }

    setBusy(null);
    toast.success("Foto atualizada");
    router.refresh();
  }

  async function onRemove() {
    setError(null);
    setBusy("removing");
    let result: ActionResult;
    try {
      result = await actions.removeAvatar();
    } catch {
      result = { ok: false, message: "Não foi possível remover a foto. Tente de novo." };
    }
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPreview(null);
    setRemoved(true);
    toast.success("Foto removida");
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Perfil</SheetTitle>
          <SheetDescription>Sua foto e a aparência do app.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <div className="flex flex-col gap-6 pt-2">
            <section aria-label="Foto" className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar displayName={displayName} src={shown} size="lg" />
                {working && (
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-scrim"
                  >
                    <Loader2 className="size-8 animate-spin text-primary-foreground" />
                  </span>
                )}
              </div>

              <p role="status" aria-live="polite" className="min-h-6 text-center text-text-muted">
                {busy ? BUSY_TEXT[busy] : ""}
              </p>

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = ""; // allows picking the same file again
                  if (file) void onFile(file);
                }}
              />
              <div className="flex w-full flex-col gap-2">
                <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={working}>
                  <Camera data-icon="inline-start" />
                  {hasPhoto ? "Trocar foto" : "Adicionar foto"}
                </Button>
                {hasPhoto && (
                  <Button variant="ghost" onClick={onRemove} disabled={working}>
                    <Trash2 data-icon="inline-start" />
                    Remover foto
                  </Button>
                )}
              </div>
              <p className="text-center text-text-muted">
                A foto fica guardada de forma privada: só você a vê.
              </p>
              <p role="alert" className="text-center font-bold text-text empty:hidden">
                {error}
              </p>
            </section>

            <section aria-labelledby="theme-title" className="flex flex-col gap-2">
              <h3 id="theme-title" className="text-lg">
                Aparência
              </h3>
              <div role="radiogroup" aria-labelledby="theme-title" className="grid grid-cols-3 gap-1 rounded-lg bg-surface-alt p-1">
                {THEMES.map((t) => {
                  const selected = t === theme;
                  return (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setTheme(t)}
                      className={cn(
                        "pressable min-h-12 rounded-md px-1 text-center leading-tight font-bold outline-none transition-[background-color,color] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50",
                        selected ? "bg-surface text-primary shadow-soft" : "text-text-muted",
                      )}
                    >
                      {THEME_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="name-title" className="flex flex-col gap-2">
              <h3 id="name-title" className="text-lg">
                Nome
              </h3>
              <p className="min-h-12 rounded-md bg-surface-alt px-4 py-3 font-bold [overflow-wrap:anywhere]">
                {displayName}
              </p>
            </section>

            <Button
              variant="ghost"
              onClick={() => startSignOut(() => actions.signOut())}
              disabled={signingOut || working}
            >
              <LogOut data-icon="inline-start" />
              {signingOut ? "Saindo..." : "Sair"}
            </Button>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
