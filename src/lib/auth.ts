import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Member = {
  userId: string;
  role: "user" | "admin";
  displayName: string;
};

// Deduped per request: the shared header and the page both ask for the member.
const loadMember = cache(async (): Promise<Member | null> => {
  const supabase = await createClient();

  // getUser() validates the token with Supabase; getSession() is never trusted here.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("members")
    .select("role, display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (data && (data.role === "user" || data.role === "admin")) {
    return { userId: user.id, role: data.role, displayName: data.display_name };
  }
  return null;
});

export async function getCurrentMember(options: { required: true }): Promise<Member>;
export async function getCurrentMember(options?: { required?: boolean }): Promise<Member | null>;
export async function getCurrentMember(
  options: { required?: boolean } = {},
): Promise<Member | null> {
  const member = await loadMember();
  if (!member && options.required) redirect("/entrar");
  return member;
}
