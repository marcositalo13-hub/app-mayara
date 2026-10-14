import { removeAvatar, setAvatar, signOut } from "@/app/actions";
import { getHeaderData } from "@/lib/data/header";
import { AccountHeader } from "./account-header";

/** Shared header for authenticated pages (avatar, greeting, date, week, account menu). */
export async function AppHeader() {
  const header = await getHeaderData();
  return (
    <AccountHeader
      userId={header.userId}
      displayName={header.displayName}
      avatarUrl={header.avatarUrl}
      dateLabel={header.dateLabel}
      weekLabel={header.weekLabel}
      isAdmin={header.isAdmin}
      actions={{ setAvatar, removeAvatar, signOut }}
    />
  );
}

/** Same footprint as the header, so nothing jumps when it streams in. */
export function AppHeaderSkeleton() {
  return (
    <div aria-hidden className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-3">
        <div className="size-12 shrink-0 rounded-full bg-surface-alt" />
        <div className="flex flex-col gap-2">
          <div className="h-8 w-40 rounded-full bg-surface-alt" />
          <div className="h-5 w-48 rounded-full bg-surface-alt" />
          <div className="h-5 w-28 rounded-full bg-surface-alt" />
        </div>
      </div>
      <div className="size-12 rounded-full bg-surface-alt" />
    </div>
  );
}
