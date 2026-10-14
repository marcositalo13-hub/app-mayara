import "server-only";

import { cache } from "react";
import { getCurrentMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const SIGNED_URL_TTL_S = 60 * 60; // 1 hour

export type Profile = {
  userId: string;
  displayName: string;
  isAdmin: boolean;
  /** Signed URL (1 h) of the private avatar, or null. */
  avatarUrl: string | null;
};

/** Signed URL for a member's avatar path, or null (never throws). */
export async function getAvatarUrl(member: { avatarPath: string | null }): Promise<string | null> {
  if (!member.avatarPath) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("avatars")
      .createSignedUrl(member.avatarPath, SIGNED_URL_TTL_S);
    return error ? null : (data?.signedUrl ?? null);
  } catch {
    return null;
  }
}

/**
 * The signed-in member's profile, deduped per request (header and pages share it).
 * The avatar is optional: if the column or the bucket isn't there yet (migration 0005 not
 * applied) or anything fails, the profile simply has no photo.
 */
export const getProfile = cache(async (): Promise<Profile> => {
  const member = await getCurrentMember({ required: true });

  let avatarPath: string | null = null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("members")
      .select("avatar_path")
      .eq("user_id", member.userId)
      .maybeSingle();
    if (!error) avatarPath = (data as { avatar_path: string | null } | null)?.avatar_path ?? null;
  } catch {
    avatarPath = null;
  }

  return {
    userId: member.userId,
    displayName: member.displayName,
    isAdmin: member.role === "admin",
    avatarUrl: await getAvatarUrl({ avatarPath }),
  };
});
