"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signIn, type SignInState } from "./actions";

const inputClass =
  "min-h-12 w-full rounded-md border border-border bg-surface px-4 text-base text-text outline-none transition-[box-shadow] placeholder:text-text-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-danger";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-2">
        <span className="font-bold">E-mail</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          defaultValue={state.email}
          aria-invalid={state.error ? true : undefined}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-bold">Senha</span>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={state.error ? true : undefined}
            className={`${inputClass} pr-14`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={showPassword}
            className="pressable absolute top-0 right-0 flex size-12 items-center justify-center rounded-full text-text-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </label>

      <p role="alert" aria-live="polite" className="min-h-6 font-bold text-danger">
        {state.error}
      </p>

      <Button type="submit" size="lg" disabled={pending} aria-busy={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
