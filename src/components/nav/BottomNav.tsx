"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, GlassWater, Target, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Dieta", icon: Utensils, match: (p: string) => p === "/" },
  { href: "/agua", label: "Água", icon: GlassWater, match: (p: string) => p.startsWith("/agua") },
  { href: "/treino", label: "Treino", icon: Dumbbell, match: (p: string) => p.startsWith("/treino") },
  { href: "/metas", label: "Metas", icon: Target, match: (p: string) => p.startsWith("/metas") },
] as const;

/** Bar content is h-16; the (app) layout reserves pb-16 for it. */
function NavShell({ activeIndex }: { activeIndex: number | null }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md"
    >
      <div className="relative mx-auto grid h-16 max-w-[480px] grid-cols-4 px-2">
        {/* Active pill slides between items (transform only, 200 ms). */}
        {activeIndex !== null && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-2 left-2 w-[calc((100%-1rem)/4)] rounded-full bg-primary-soft transition-transform duration-200 ease-(--ease-out)"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
        )}
        {ITEMS.map((item, i) => {
          const active = i === activeIndex;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "pressable relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-full font-bold leading-tight outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/50",
                active ? "text-primary" : "text-text-muted",
              )}
            >
              <Icon aria-hidden className="size-6" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function ActiveNav() {
  const pathname = usePathname();
  const index = ITEMS.findIndex((item) => item.match(pathname));
  return <NavShell activeIndex={index === -1 ? null : index} />;
}

export { ActiveNav as BottomNav, NavShell as BottomNavFallback };
