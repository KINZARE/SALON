import Link from "next/link";
import { requireAppContext } from "@/lib/auth";

export default async function MorePage() {
  const { membership } = await requireAppContext();
  const items = membership.role === "staff"
    ? [["Settings", "Account en voorkeuren", "/app/settings"]] as const
    : [
        ["Services", "Behandelingen, duur en prijs", "/app/services"],
        ["Staff", "Medewerkers en beschikbaarheid", "/app/staff"],
        ["Blocks", "Vrije tijd, vakantie en sluitingen", "/app/blocks"],
        ["Reports", "Operationele rapportage", "/app/reports"],
        ["Settings", "Salon, booking en account", "/app/settings"],
      ] as const;

  return (
    <>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Beheer</p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.055em]">More</h1>
      </header>

      <div className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {items.map(([title, description, href]) => (
          <Link key={href} href={href} className="group grid min-h-[76px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
            <span className="min-w-0">
              <span className="block font-semibold tracking-[-0.02em]">{title}</span>
              <span className="mt-1 block truncate text-sm text-[var(--muted)]">{description}</span>
            </span>
            <span className="text-[var(--subtle)] transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
          </Link>
        ))}
      </div>
    </>
  );
}
