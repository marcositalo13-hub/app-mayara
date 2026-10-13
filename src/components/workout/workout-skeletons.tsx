// Static placeholders shaped like the Treino screens (no layout shift when content streams in).

function Block({ className }: { className: string }) {
  return <div aria-hidden className={`rounded-full bg-surface-alt ${className}`} />;
}

function CardShell({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div aria-hidden className={`rounded-xl bg-surface shadow-soft ring-1 ring-border ${className}`}>
      {children}
    </div>
  );
}

export function TreinoSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Carregando treino">
      <Block className="h-8 w-28" />
      <CardShell className="flex flex-col gap-4 p-5">
        <Block className="h-5 w-28" />
        <Block className="h-7 w-56" />
        {Array.from({ length: 6 }, (_, i) => (
          <Block key={i} className="h-5 w-full" />
        ))}
        <Block className="h-14 w-full" />
        <Block className="h-12 w-full" />
      </CardShell>
      <CardShell className="h-[196px]" />
    </div>
  );
}

export function SessionSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Carregando treino">
      <div className="flex flex-col gap-2">
        <Block className="h-8 w-60" />
        <Block className="h-5 w-40" />
        <Block className="h-2.5 w-full" />
      </div>
      {Array.from({ length: 2 }, (_, i) => (
        <CardShell key={i} className="flex flex-col gap-4 p-4">
          <div className="aspect-[3/2] w-full rounded-lg bg-surface-alt" />
          <Block className="h-7 w-48" />
          <Block className="h-5 w-36" />
          <Block className="h-12 w-full" />
          <Block className="h-12 w-full" />
        </CardShell>
      ))}
    </div>
  );
}
