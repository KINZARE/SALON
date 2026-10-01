import { requireAppContext } from "@/lib/auth";
import { getServices } from "@/services/app-data";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { createService, toggleService } from "./actions";

export default async function ServicesPage() {
  const { salon, membership } = await requireAppContext();
  if (membership.role === "staff") return <AccessDenied />;
  const items = await getServices(salon.id);

  return (
    <>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Menu</p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.055em]">Services</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Behandelingen, duur en prijs — precies wat nodig is om goed te kunnen boeken.</p>
      </header>

      <section className="mt-9">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h2 className="text-sm font-medium">Behandelingen</h2>
          <p className="text-xs text-[var(--muted)]">{items.length} totaal</p>
        </div>

        {!items.length ? (
          <div className="mt-5">
            <EmptyState title="Nog geen behandelingen" description="Voeg je eerste behandeling toe om afspraken te kunnen plannen." />
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {items.map((item) => (
              <div key={item.id} className={`grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${item.active ? "" : "opacity-55"}`}>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold tracking-[-0.02em]">{item.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {item.duration_minutes} min · {item.online_bookable ? "Online boekbaar" : "Alleen intern"}
                    {!item.active ? " · Inactief" : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <p className="text-base font-semibold tabular-nums">{formatMoney(item.price_cents, item.currency)}</p>
                  {membership.role === "owner" ? (
                    <form action={toggleService}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="active" value={String(item.active)} />
                      <button className="min-h-10 rounded-[var(--radius-pill)] bg-[var(--surface)] px-4 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]">
                        {item.active ? "Pauzeren" : "Activeren"}
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {membership.role === "owner" ? (
        <section className="mt-12 max-w-2xl rounded-[var(--radius-card)] bg-[var(--surface)] p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Nieuw</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Behandeling toevoegen</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">Duur en prijs worden later automatisch gebruikt bij afspraken en beschikbaarheid.</p>

          <form action={createService} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Naam" name="name" required maxLength={120} />
            </div>
            <Field label="Duur (minuten)" name="duration" type="number" min={5} max={720} defaultValue={60} required />
            <Field label="Prijs (€)" name="price" inputMode="decimal" defaultValue="65,00" required />
            <Field label="Buffer na afspraak (min)" name="buffer" type="number" min={0} max={180} defaultValue={0} required />
            <label className="flex min-h-11 items-center gap-3 self-end text-sm font-medium">
              <input type="checkbox" name="onlineBookable" defaultChecked className="h-4 w-4 accent-[var(--accent)]" />
              Online boekbaar
            </label>
            <div className="sm:col-span-2">
              <TextAreaField label="Beschrijving (optioneel)" name="description" maxLength={600} rows={3} />
            </div>
            <div className="sm:col-span-2">
              <Button>Behandeling toevoegen</Button>
            </div>
          </form>
        </section>
      ) : null}
    </>
  );
}

function AccessDenied() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Services</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Geen toegang</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Deze pagina is alleen beschikbaar voor owner en manager.</p>
    </div>
  );
}
