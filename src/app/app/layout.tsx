import { AppNav } from "@/components/app-shell/nav";
import { requireAppContext } from "@/lib/auth";
import { isPreviewDemoMode } from "@/lib/preview-mode";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAppContext();
  const preview = isPreviewDemoMode();

  return (
    <div className="min-h-screen bg-white md:pl-64">
      <AppNav role={context.membership.role} />

      <main className="mx-auto w-full max-w-[88rem] px-5 pb-32 pt-5 sm:px-7 md:px-8 md:pb-12 md:pt-7 lg:px-10">
        {preview ? (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-[var(--radius-control)] border border-[#ead5c5] bg-[var(--accent-soft)] px-4 py-3 text-sm leading-6 text-[#74411f]"
          >
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" aria-hidden="true" />
            <p>
              <strong className="font-semibold">Preview mode</strong>
              <span className="text-[#8b5a39]"> · Demo-data; wijzigingen worden niet opgeslagen.</span>
            </p>
          </div>
        ) : null}

        <div className="mb-8 flex min-h-11 items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <p className="min-w-0 truncate text-sm font-medium tracking-[-0.01em] text-[var(--muted)]">
            {context.salon.name}
          </p>
          <a
            href={`/book/${context.salon.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 shrink-0 items-center rounded-[var(--radius-pill)] bg-[var(--surface)] px-4 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-2)]"
          >
            Booking openen ↗
          </a>
        </div>

        {children}
      </main>
    </div>
  );
}
