import Link from "next/link";

export function QuickActions({ canManage }: { canManage: boolean }) {
  if (!canManage) return null;
  return <Link href="/app/calendar/new" className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[var(--primary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-dark)]">Nieuwe afspraak</Link>;
}
