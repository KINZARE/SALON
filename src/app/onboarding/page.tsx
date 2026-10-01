import { bootstrapSalon } from "./actions";
import { requireUser } from "@/lib/auth";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const days = [[1, "Ma"], [2, "Di"], [3, "Wo"], [4, "Do"], [5, "Vr"], [6, "Za"], [0, "Zo"]] as const;

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="min-h-screen bg-[var(--surface)] px-5 py-8 sm:py-12">
      <form action={bootstrapSalon} className="mx-auto w-full max-w-2xl rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-9">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink)] text-[10px] font-semibold tracking-[0.08em] text-white">S</span>
          <span className="text-sm font-semibold tracking-[-0.03em]">SALON</span>
        </div>

        <p className="mt-9 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Eenmalige setup</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Binnen een paar minuten boekbaar</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
          We maken je salon, eerste behandeling, eerste medewerker en basisrooster in één keer aan.
        </p>

        <div className="mt-9 grid gap-8">
          <section>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">01 · Salon</p>
            <Field label="Salonnaam" name="salonName" required placeholder="Siam Wellness" />
          </section>

          <section className="border-t border-[var(--line)] pt-7">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">02 · Openingstijden</p>
            <div className="flex flex-wrap gap-2">
              {days.map(([value, label]) => (
                <label key={value} className="cursor-pointer">
                  <input className="peer sr-only" type="checkbox" name="weekdays" value={value} defaultChecked={value !== 0} />
                  <span className="flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--line)] bg-white px-3 text-sm peer-checked:border-[var(--ink)] peer-checked:bg-[var(--ink)] peer-checked:text-white">
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Open" name="openTime" type="time" defaultValue="09:00" required />
              <Field label="Dicht" name="closeTime" type="time" defaultValue="18:00" required />
            </div>
          </section>

          <section className="border-t border-[var(--line)] pt-7">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">03 · Eerste behandeling</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Naam" name="serviceName" defaultValue="Thai Massage" required />
              </div>
              <Field label="Duur (minuten)" name="duration" type="number" min={5} max={720} defaultValue={60} required />
              <Field label="Prijs (€)" name="price" inputMode="decimal" defaultValue="65,00" required />
            </div>
          </section>

          <section className="border-t border-[var(--line)] pt-7">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">04 · Eerste medewerker</p>
            <Field
              label="Naam"
              name="staffName"
              defaultValue="Nok"
              required
              hint="Je kunt later meer medewerkers en afwijkende roosters toevoegen."
            />
          </section>

          {error ? (
            <div role="alert" className="rounded-[var(--radius-control)] border border-[#e7c3bd] bg-[#fff7f5] p-4 text-sm leading-6 text-[var(--danger)]">
              {error}
            </div>
          ) : null}

          <Button size="lg" className="w-full">Salon aanmaken</Button>
        </div>
      </form>
    </main>
  );
}
