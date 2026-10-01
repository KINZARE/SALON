import { requireAppContext } from "@/lib/auth";
import { getServices, getStaff } from "@/services/app-data";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { createStaff, toggleStaff } from "./actions";

const days = [[1, "Ma"], [2, "Di"], [3, "Wo"], [4, "Do"], [5, "Vr"], [6, "Za"], [0, "Zo"]] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "S";
}

export default async function StaffPage() {
  const { salon, membership } = await requireAppContext();
  if (membership.role === "staff") return <AccessDenied />;

  const [items, services] = await Promise.all([getStaff(salon.id), getServices(salon.id)]);
  const activeServices = services.filter((service) => service.active);

  return (
    <>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Team</p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.055em]">Staff</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Wie werkt wanneer en welke behandelingen kan die persoon uitvoeren.</p>
      </header>

      <section className="mt-9">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h2 className="text-sm font-medium">Medewerkers</h2>
          <p className="text-xs text-[var(--muted)]">{items.length} totaal</p>
        </div>

        {!items.length ? (
          <div className="mt-5">
            <EmptyState title="Nog geen medewerkers" description="Voeg je eerste medewerker toe om een werkrooster en behandelingen te koppelen." />
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {items.map((item) => (
              <div key={item.id} className={`grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 py-4 sm:grid-cols-[44px_minmax(0,1fr)_auto] ${item.active ? "" : "opacity-55"}`}>
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-semibold">
                  {initials(item.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold tracking-[-0.02em]">{item.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.active ? "Actief" : "Inactief"}</p>
                </div>
                {membership.role === "owner" ? (
                  <form action={toggleStaff} className="col-start-2 sm:col-start-auto">
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="active" value={String(item.active)} />
                    <button className="min-h-10 rounded-[var(--radius-pill)] bg-[var(--surface)] px-4 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)]">
                      {item.active ? "Pauzeren" : "Activeren"}
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {membership.role === "owner" ? (
        <section className="mt-12 max-w-2xl rounded-[var(--radius-card)] bg-[var(--surface)] p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Nieuw</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Medewerker toevoegen</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Stel het normale weekritme in. Vrije tijd en uitzonderingen regel je later met blocks.</p>

          <form action={createStaff} className="mt-6 grid gap-6">
            <Field label="Naam" name="name" required maxLength={120} />

            <div>
              <p className="mb-3 text-sm font-medium">Behandelingen</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {activeServices.map((service) => (
                  <label key={service.id} className="flex min-h-12 items-center gap-3 rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-3.5 text-sm">
                    <input type="checkbox" name="serviceIds" value={service.id} className="h-4 w-4 accent-[var(--accent)]" />
                    <span className="min-w-0 truncate">{service.name}</span>
                  </label>
                ))}
              </div>
              {!activeServices.length ? <p className="text-sm text-[var(--muted)]">Maak eerst een actieve behandeling aan.</p> : null}
            </div>

            <div>
              <p className="mb-3 text-sm font-medium">Werkdagen</p>
              <div className="flex flex-wrap gap-2">
                {days.map(([value, label]) => (
                  <label key={value} className="cursor-pointer">
                    <input className="peer sr-only" type="checkbox" name="weekdays" value={value} defaultChecked={value !== 0} />
                    <span className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--line)] bg-white px-3 text-sm transition-colors peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)] peer-checked:text-white">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start" name="startTime" type="time" defaultValue="09:00" required />
              <Field label="Einde" name="endTime" type="time" defaultValue="18:00" required />
            </div>

            <div>
              <Button disabled={!activeServices.length}>Medewerker toevoegen</Button>
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
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Staff</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Geen toegang</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Deze pagina is alleen beschikbaar voor owner en manager.</p>
    </div>
  );
}
