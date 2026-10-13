import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Member = {
  userId: string;
  role: "user" | "admin";
  displayName: string;
};

export async function getCurrentMember(options: { required: true }): Promise<Member>;
export async function getCurrentMember(options?: { required?: boolean }): Promise<Member | null>;
export async function getCurrentMember(
  options: { required?: boolean } = {},
): Promise<Member | null> {
  const supabase = await createClient();

  // getUser() validates the token with Supabase; getSession() is never trusted here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let member: Member | null = null;
  if (user) {
    const { data } = await supabase
      .from("members")
      .select("role, display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data && (data.role === "user" || data.role === "admin")) {
      member = { userId: user.id, role: data.role, displayName: data.display_name };
    }
  }

  if (!member && options.required) redirect("/entrar");
  return member;
}
