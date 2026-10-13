import { Suspense } from "react";
import { BottomNav, BottomNavFallback } from "@/components/nav/BottomNav";

// Authenticated pages: content gets bottom room for the fixed nav (the safe-area part
// is already covered by the body's own padding in globals.css).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="flex flex-1 flex-col pb-16">{children}</div>
      {/* usePathname suspends on dynamic routes (e.g. /treino/[sessionId]) under Cache Components. */}
      <Suspense fallback={<BottomNavFallback activeIndex={null} />}>
        <BottomNav />
      </Suspense>
    </>
  );
}
