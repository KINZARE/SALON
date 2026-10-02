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
      <div className="sticky top-0 z-30 hidden h-[74px] items-center border-b border-[var(--border)] bg-white/90 px-6 backdrop-blur-xl md:flex xl:px-8">
        <div className="flex min-w-0 flex-1 items-center">{canSearch ? <OperationalSearch /> : null}</div>
        <div className="ml-6 flex items-center gap-3 border-l border-[var(--border)] pl-5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--secondary)] text-sm font-semibold text-[var(--ink)]">{initial}</div>
          <div className="hidden text-right lg:block">
            <p className="max-w-[220px] truncate text-sm font-semibold">{context.salon.name}</p>
            <a href={`/book/${context.salon.slug}`} target="_blank" rel="noreferrer" className="text-xs text-[var(--muted)] hover:text-[var(--accent)]">Online booking ↗</a>
          </div>
        </div>
      </div>
      <main className="mx-auto w-full max-w-[1760px] px-4 pb-28 pt-5 sm:px-6 md:pb-12 md:pt-7 xl:px-8">
        <div className="mb-6 flex items-center justify-between gap-3 md:hidden">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[var(--accent)]">SALON</p>
            <p className="mt-0.5 max-w-[220px] truncate text-sm font-semibold">{context.salon.name}</p>
          </div>
          {canSearch ? <OperationalSearch /> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
