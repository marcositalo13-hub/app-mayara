// Client-only: talks to the private "avatars" bucket with the member's own session (RLS applies).
import { createClient } from "@/lib/supabase/client";
import type { ProcessedAvatar } from "./process-image";

export type AvatarUploader = {
  /** Uploads to avatars/<userId>/<timestamp>.<ext>; resolves to the object path. */
  upload: (userId: string, avatar: ProcessedAvatar) => Promise<{ ok: true; path: string } | { ok: false }>;
  /** Best-effort cleanup of an object that must not stay behind. */
  remove: (path: string) => Promise<void>;
};

export const storageUploader: AvatarUploader = {
  async upload(userId, avatar) {
    const path = `${userId}/${Date.now()}.${avatar.extension}`;
    try {
      const { error } = await createClient()
        .storage.from("avatars")
        .upload(path, avatar.blob, { contentType: avatar.contentType, cacheControl: "3600", upsert: false });
      return error ? { ok: false } : { ok: true, path };
    } catch {
      return { ok: false };
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
