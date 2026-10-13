"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, House } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Hoje", icon: House, match: (p: string) => p === "/" },
  { href: "/treino", label: "Treino", icon: Dumbbell, match: (p: string) => p.startsWith("/treino") },
] as const;

/** Height of the bar's content, excluding the safe-area inset (keep in sync with BOTTOM_NAV_SPACE). */
const BAR = "h-16";

function NavShell({ activeIndex }: { activeIndex: number | null }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md"
    >
      <div className={cn("relative mx-auto grid max-w-[480px] grid-cols-2 px-4", BAR)}>
        {/* Active pill slides between items (transform only). */}
        {activeIndex !== null && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-2 left-4 w-[calc(50%-1rem)] rounded-full bg-primary-soft transition-transform duration-200 ease-(--ease-out)"
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
                "pressable relative flex min-h-12 items-center justify-center gap-2 rounded-full font-bold outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/50",
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
