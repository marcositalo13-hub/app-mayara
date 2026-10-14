import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNavFallback } from "@/components/nav/BottomNav";
import { DevProfile, type DevMode } from "./dev-profile";

// Dev-only preview of the header + profile sheet: /dev/perfil?mode=ok|slow|upload-fails|save-fails&name=...&persist=1 (real theme cookie)

const MODES: DevMode[] = ["ok", "slow", "upload-fails", "save-fails"];
const NAMES: Record<string, string> = {
  curto: "Ma",
  mayara: "Mayara",
  longo: "Mayara Cristina de Albuquerque Wiśniewska-Kowalczyk",
  emoji: "🌸 Mayara",
};

type SearchParams = Promise<{ mode?: string; name?: string; persist?: string }>;

async function DevPerfil({ searchParams }: { searchParams: SearchParams }) {
  const { mode = "ok", name = "mayara", persist } = await searchParams;
  const safeMode = (MODES as string[]).includes(mode) ? (mode as DevMode) : "ok";

  return (
    <>
      <DevProfile
        key={`${safeMode}-${name}-${persist}`}
        mode={safeMode}
        displayName={NAMES[name] ?? NAMES.mayara}
        realTheme={persist === "1"}
      />
      <nav
        aria-label="Dados de teste"
        className="fixed inset-x-0 top-0 z-50 flex gap-1 overflow-x-auto bg-text p-1 font-mono text-base text-background"
      >
        {MODES.map((m) => (
          <Link
            key={m}
            href={`/dev/perfil?mode=${m}&name=${name}`}
            className={`shrink-0 rounded-full px-3 py-1 ${m === safeMode ? "bg-background text-text" : ""}`}
          >
            {m}
          </Link>
        ))}
        {Object.keys(NAMES).map((n) => (
          <Link
            key={n}
            href={`/dev/perfil?mode=${safeMode}&name=${n}`}
            className={`shrink-0 rounded-full px-3 py-1 underline ${n === name ? "bg-background text-text" : ""}`}
          >
            {n}
          </Link>
        ))}
      </nav>
    </>
  );
}

export default function DevPerfilPage({ searchParams }: { searchParams: SearchParams }) {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <>
      <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-14 pb-24">
        <Suspense>
          <DevPerfil searchParams={searchParams} />
        </Suspense>
      </main>
      <BottomNavFallback activeIndex={null} />
    </>
  );
}
