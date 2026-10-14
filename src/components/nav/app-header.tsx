import { signOut } from "@/app/actions";
import { getHeaderData } from "@/lib/data/header";
import { AccountHeader } from "./account-header";

/** Shared header for authenticated pages (greeting, date, week, account menu). */
export async function AppHeader() {
  const header = await getHeaderData();
  return (
    <AccountHeader
      displayName={header.displayName}
      dateLabel={header.dateLabel}
      weekLabel={header.weekLabel}
      isAdmin={header.isAdmin}
      signOut={signOut}
    />
  );
}

/** Same footprint as the header, so nothing jumps when it streams in. */
export function AppHeaderSkeleton() {
  return (
    <div aria-hidden className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-40 rounded-full bg-surface-alt" />
        <div className="h-5 w-56 rounded-full bg-surface-alt" />
        <div className="h-5 w-28 rounded-full bg-surface-alt" />
      </div>
      <div className="size-12 rounded-full bg-surface-alt" />
    </div>
  );
}
