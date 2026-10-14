import { GoalsSkeleton } from "@/components/goals/goals-section";

// Static placeholder shaped like Metas (goals + Corpo), so content swaps in without layout shift.

function Block({ className }: { className: string }) {
  return <div aria-hidden className={`rounded-full bg-surface-alt ${className}`} />;
}

function CardShell({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div aria-hidden className={`rounded-xl bg-surface shadow-soft ring-1 ring-border ${className}`}>
      {children}
    </div>
  );
}

export function MetasSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Carregando as medidas">
      <div className="flex items-center gap-3">
        <div aria-hidden className="size-12 rounded-full bg-surface-alt" />
        <Block className="h-8 w-48" />
      </div>
      <GoalsSkeleton />
      <div className="flex flex-col gap-4">
        <Block className="h-7 w-20" />
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <CardShell key={i} className="flex flex-col gap-2 p-5">
              <Block className="h-5 w-16" />
              <Block className="h-9 w-24" />
              <Block className="h-5 w-20" />
              <Block className="h-5 w-full" />
            </CardShell>
          ))}
        </div>
        <Block className="h-14 w-full" />
        <CardShell className="h-[330px]" />
        <CardShell className="h-[250px]" />
      </div>
    </div>
  );
}
