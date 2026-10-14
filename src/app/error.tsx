"use client";

import { Button } from "@/components/ui/button";

export default function Error({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <h1 className="text-2xl">Não foi possível carregar esta tela</h1>
      <p className="text-text-muted">Verifique a conexão e tente de novo.</p>
      <Button onClick={() => retry()}>Tentar de novo</Button>
    </main>
  );
}
