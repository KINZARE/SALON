import Link from "next/link";
import { requireAppContext } from "@/lib/auth";
import { getCustomers } from "@/services/app-data";
import { EmptyState } from "@/components/ui/empty-state";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "K";
}

export default async function CustomersPage() {
  const { salon, membership } = await requireAppContext();

  if (membership.role === "staff") {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Customers</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Geen toegang</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Deze klantlijst is alleen beschikbaar voor owner en manager.</p>
      </div>
    );
  }

  const customers = await getCustomers(salon.id);

  return (
    <>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Relaties</p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.055em]">Customers</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Contact en afspraakcontext, zonder onnodige CRM-laag.</p>
      </header>

      <div className="mt-8 flex items-center justify-between border-b border-[var(--line)] pb-3">
        <p className="text-sm font-medium">Klanten</p>
        <p className="text-xs text-[var(--muted)]">{customers.length} totaal</p>
      </div>

      {!customers.length ? (
        <div className="mt-5">
          <EmptyState
            title="Nog geen klanten"
            description="Klanten worden automatisch aangemaakt wanneer een afspraak wordt geboekt."
          />
        </div>
      ) : (
        <div className="divide-y divide-[var(--line)]">
          {customers.map((customer) => {
            const contact = [customer.phone, customer.email].filter(Boolean).join(" · ");
            return (
              <Link
                href={`/app/customers/${customer.id}`}
                key={customer.id}
                className="group grid min-h-[76px] grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 py-3.5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-semibold tracking-[0.02em] text-[var(--foreground)]">
                  {initials(customer.name)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold tracking-[-0.02em]">{customer.name}</span>
                  <span className="mt-1 block truncate text-sm text-[var(--muted)]">{contact || "Geen contactgegevens"}</span>
                </span>
                <span className="text-sm text-[var(--subtle)] transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
