// Client-only: talks to the private "avatars" bucket with the member's own session (RLS applies).
import { createClient } from "@/lib/supabase/client";
import type { ProcessedAvatar } from "./process-image";

/** What the Storage API (or the network) actually said. */
export type UploadError = {
  /** Storage's own code ("404", "403"...), else the HTTP status; undefined for network errors. */
  code?: number;
  /** HTTP status of the response, when there was one. */
  status?: number;
  statusCode?: string;
  message: string;
  /** True when no HTTP response came back at all (offline, CORS, blocked request). */
  network: boolean;
};

export type AvatarUploader = {
  /** Uploads to avatars/<userId>/<timestamp>.<ext>; resolves to the object path. */
  upload: (
    userId: string,
    avatar: ProcessedAvatar,
  ) => Promise<{ ok: true; path: string } | { ok: false; error?: UploadError }>;
  /** Best-effort cleanup of an object that must not stay behind. */
  remove: (path: string) => Promise<void>;
};

function toUploadError(error: unknown): UploadError {
  const e = error as { name?: string; message?: string; status?: unknown; statusCode?: unknown } | null;
  const status = typeof e?.status === "number" ? e.status : undefined;
  const statusCode = e?.statusCode !== undefined ? String(e.statusCode) : undefined;
  // Storage reports e.g. RLS and missing buckets as HTTP 400 with its own statusCode "403"/"404".
  const code = Number(statusCode) || status || undefined;
  return {
    code,
    status,
    statusCode,
    message: e?.message ?? String(error),
    // StorageUnknownError = the request never produced an HTTP response.
    network: e?.name === "StorageUnknownError" && code === undefined,
  };
}

/** pt-BR message for the person, specific to what went wrong. */
export function describeUploadError(error: UploadError | undefined): string {
  if (!error) return "Não foi possível enviar a foto. Verifique a conexão e tente de novo.";
  if (error.code === 404) return "O armazenamento de fotos ainda não está configurado.";
  if (error.code === 401 || error.code === 403) {
    return "Sua sessão expirou ou não tem permissão para enviar fotos. Entre de novo.";
  }
  if (error.network) return "Não foi possível enviar a foto. Verifique a conexão e tente de novo.";
  return error.code !== undefined
    ? `Não foi possível enviar a foto (código ${error.code}).`
    : "Não foi possível enviar a foto.";
}

export const storageUploader: AvatarUploader = {
  async upload(userId, avatar) {
    const path = `${userId}/${Date.now()}.${avatar.extension}`;
    try {
      const { error } = await createClient()
        .storage.from("avatars")
        .upload(path, avatar.blob, { contentType: avatar.contentType, cacheControl: "3600", upsert: false });
      if (error) {
        console.error("[avatar] storage upload failed", error);
        return { ok: false, error: toUploadError(error) };
      }
      return { ok: true, path };
    } catch (e) {
      console.error("[avatar] storage upload threw", e);
      return { ok: false, error: toUploadError(e) };
    }
  },
  async remove(path) {
    try {
      await createClient().storage.from("avatars").remove([path]);
    } catch {
      // Nothing else to do from here.
    }
  },
};
