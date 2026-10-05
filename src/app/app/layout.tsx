import { AppNav } from "@/components/app-shell/nav";
import { OperationalSearch } from "@/components/app-shell/operational-search";
import { requireAppContext } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAppContext();
  const canSearch = context.membership.role !== "staff";
  const initial = context.salon.name.trim().slice(0, 1).toUpperCase() || "S";

  return (
    <div className="min-h-screen bg-[var(--background)] md:pl-64">
      <AppNav role={context.membership.role} />
      <div className="sticky top-0 z-30 hidden h-[74px] items-center border-b border-[var(--border)] bg-white px-6 md:flex xl:px-8">
        <div className="flex min-w-0 flex-1 items-center">{canSearch ? <OperationalSearch /> : null}</div>
        <div className="ml-6 flex items-center gap-3 border-l border-[var(--border)] pl-5">
          <div className="grid h-9 w-9 place-items-center rounded-[10px] border border-[var(--border-strong)] bg-[var(--secondary-soft)] text-sm font-bold text-[var(--accent-dark)]">{initial}</div>
          <div className="hidden min-w-0 text-right lg:block">
            <p className="max-w-[220px] truncate text-sm font-bold text-[var(--ink)]">{context.salon.name}</p>
            <a href={`/book/${context.salon.slug}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-[var(--muted)] hover:text-[var(--accent-dark)]">Online booking ↗</a>
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-[1760px] px-4 pb-28 pt-5 sm:px-6 md:pb-12 md:pt-7 xl:px-8">
        <div className="mb-6 flex min-w-0 items-center justify-between gap-3 md:hidden">
          <div className="min-w-0">
            <p className="font-display text-[19px] font-extrabold tracking-[-.05em] text-[var(--ink)]">ORSIRA</p>
            <p className="mt-0.5 max-w-[220px] truncate text-sm font-semibold text-[var(--muted)]">{context.salon.name}</p>
          </div>
          {canSearch ? <OperationalSearch /> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
