"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignInState = { error?: string; email?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = "Não foi possível entrar agora. Tente de novo.";

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Informe um e-mail válido.", email };
  if (!password) return { error: "Informe a senha.", email };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      // Only a real credentials rejection is reported as such; everything else is generic.
      const isCredentials = error?.code === "invalid_credentials";
      return {
        error: isCredentials ? "E-mail ou senha incorretos." : GENERIC_ERROR,
        email,
      };
    }

    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (memberError) {
      await supabase.auth.signOut();
      return { error: GENERIC_ERROR, email };
    }
    if (!member) {
      await supabase.auth.signOut();
      return { error: "Esta conta não tem acesso ao app.", email };
    }
  } catch {
    return { error: GENERIC_ERROR, email };
  }

  redirect("/");
}
