// Static placeholder shaped like the Dieta tab (below the shared header), so content swaps in without layout shift.

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

export function TodaySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Carregando a dieta">
      <CardShell className="flex items-center gap-5 p-5">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="h-[95px] w-[104px] rounded-lg bg-primary-soft/60" />
          <Block className="h-8 w-14" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Block className="h-7 w-24" />
          <Block className="h-5 w-32" />
          <Block className="h-5 w-40" />
        </div>
      </CardShell>

      <div className="flex items-center justify-between">
        <Block className="h-7 w-32" />
        <Block className="h-12 w-28" />
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <CardShell key={i} className="flex items-start gap-3 p-4">
            <div className="flex flex-1 flex-col gap-2">
              <Block className="h-5 w-14" />
              <Block className="h-6 w-40" />
              <Block className="h-5 w-32" />
            </div>
            <Block className="size-12" />
          </CardShell>
        ))}
      </div>
    </div>
  );
}
