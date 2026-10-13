"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Heart, Moon, Sun, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CelebrationBurst,
  CheckItem,
  HeartProgress,
  WaterTracker,
} from "@/components/cute";

const TOKENS = [
  "background",
  "surface",
  "surface-alt",
  "text",
  "text-muted",
  "border",
  "primary",
  "primary-foreground",
  "primary-soft",
  "accent",
  "accent-soft",
  "success",
  "success-soft",
  "warning",
  "danger",
] as const;

/** Reads the live value of a token, so hex labels always match the active theme. */
function Swatch({ token }: { token: (typeof TOKENS)[number] }) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="size-12 shrink-0 rounded-sm ring-1 ring-border"
        style={{ background: `var(--${token})` }}
      />
      <span className="flex min-w-0 flex-col">
        <span className="font-bold">--{token}</span>
        <span
          className="text-text-muted uppercase tabular-nums"
          ref={(el) => {
            if (el) {
              const value = getComputedStyle(el)
                .getPropertyValue(`--${token}`)
                .trim();
              // The CSS minifier shortens #FFFFFF to #FFF; show the full form.
              el.textContent = /^#[0-9a-f]{3}$/i.test(value)
                ? `#${[...value.slice(1)].map((c) => c + c).join("")}`
                : value;
            }
          }}
        />
      </span>
    </li>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl">{title}</h2>
      {children}
    </section>
  );
}

export function StylePreview() {
  const [themeVersion, setThemeVersion] = useState(0);
  const [progress, setProgress] = useState(40);
  const [celebrating, setCelebrating] = useState(false);
  const celebrated = useRef(false);

  function toggleTheme() {
    // Preview only: explicit class overrides the OS preference; not persisted.
    const root = document.documentElement;
    const isDark =
      root.classList.contains("dark") ||
      (!root.classList.contains("light") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", !isDark);
    root.classList.toggle("light", isDark);
    setThemeVersion((v) => v + 1);
  }

  function changeProgress(value: number) {
    setProgress(value);
    if (value === 100 && !celebrated.current) {
      celebrated.current = true;
      setCelebrating(true);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-10 px-4 py-6">
      <header className="flex items-center justify-between gap-2">
        <Link
          href="/"
          aria-label="Voltar"
          className="pressable flex size-12 items-center justify-center rounded-full text-primary"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <h1 className="text-2xl">Estilo</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Alternar tema claro/escuro"
        >
          <Sun className="size-6 dark:hidden" />
          <Moon className="hidden size-6 dark:block" />
        </Button>
      </header>

      <Section title="Paleta">
        <ul key={themeVersion} className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
          {TOKENS.map((token) => (
            <Swatch key={token} token={token} />
          ))}
        </ul>
      </Section>

      <Section title="Tipografia">
        <div className="flex flex-col gap-3 rounded-lg bg-surface p-5 shadow-soft">
          <p className="text-3xl font-extrabold leading-tight tracking-tight">
            Título 1 · 30px
          </p>
          <p className="text-2xl font-extrabold leading-tight">Título 2 · 24px</p>
          <p>Corpo · 16px. Texto do dia a dia, confortável de ler.</p>
          <p className="text-text-muted">Pequeno · 16px em tom suave</p>
        </div>
      </Section>

      <Section title="Botões">
        <div className="flex flex-col gap-3">
          <Button>Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="ghost">Discreto</Button>
        </div>
      </Section>

      <Section title="Refeição">
        <Card>
          <CardHeader>
            <CardTitle>Café da manhã · 09:00</CardTitle>
            <CardDescription>Dados de exemplo</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            <CheckItem title="Exemplo: 1 pão francês" subtitle="Item fictício" />
            <CheckItem title="Exemplo: 1 ovo mexido" subtitle="Item fictício" />
            <CheckItem title="Exemplo: 1 fruta" subtitle="Item fictício" />
          </CardContent>
        </Card>
      </Section>

      <Section title="Água">
        <Card>
          <CardContent>
            <WaterTracker />
          </CardContent>
        </Card>
      </Section>

      <Section title="Progresso do dia">
        <Card>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative flex w-full justify-center py-4">
              <HeartProgress value={progress} />
              {celebrating && (
                <CelebrationBurst onDone={() => setCelebrating(false)} />
              )}
            </div>
            <label className="flex w-full flex-col gap-2">
              <span className="text-text-muted">Simular o dia</span>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={progress}
                onChange={(e) => changeProgress(Number(e.target.value))}
                className="h-12 w-full accent-primary"
              />
            </label>
          </CardContent>
        </Card>
      </Section>

      <Section title="Aviso">
        <Button
          variant="secondary"
          onClick={() =>
            toast("Treino salvo", {
              icon: <Heart className="size-5 fill-primary text-primary" />,
            })
          }
        >
          <Heart data-icon="inline-start" />
          Mostrar aviso
        </Button>
      </Section>
    </main>
  );
}
