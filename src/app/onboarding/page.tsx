import { bootstrapSalon } from "./actions";
import { requireUser } from "@/lib/auth";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const days = [[1,"Ma"],[2,"Di"],[3,"Wo"],[4,"Do"],[5,"Vr"],[6,"Za"],[0,"Zo"]] as const;

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser();
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  return <main className="min-h-screen bg-white px-5 py-8 sm:bg-[var(--background)]">
    <form action={bootstrapSalon} className="mx-auto w-full max-w-xl sm:rounded-[18px] sm:border sm:border-[var(--border)] sm:bg-white sm:p-9">
      <p className="text-sm font-medium text-[var(--primary)]">Eenmalige setup</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em]">Binnen een paar minuten boekbaar</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">We maken direct je salon, eerste behandeling, eerste medewerker en rooster aan.</p>

      <div className="mt-8 grid gap-6">
        <Field label="Salonnaam" name="salonName" required placeholder="Siam Wellness" />
        <div>
          <p className="mb-2 text-sm font-medium">Open dagen</p>
          <div className="flex flex-wrap gap-2">
            {days.map(([value,label]) => <label key={value} className="cursor-pointer"><input className="peer sr-only" type="checkbox" name="weekdays" value={value} defaultChecked={value !== 0} /><span className="flex h-10 min-w-11 items-center justify-center rounded-[10px] border border-[var(--border)] bg-white px-3 text-sm peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary-soft)]">{label}</span></label>)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3"><Field label="Open" name="openTime" type="time" defaultValue="09:00" required /><Field label="Dicht" name="closeTime" type="time" defaultValue="18:00" required /></div>
        </div>
        <div className="border-t border-[var(--border)] pt-6">
          <h2 className="text-base font-semibold">Eerste behandeling</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Naam" name="serviceName" defaultValue="Thai Massage" required /></div><Field label="Duur (minuten)" name="duration" type="number" min={5} max={720} defaultValue={60} required /><Field label="Prijs (€)" name="price" inputMode="decimal" defaultValue="65,00" required /></div>
        </div>
        <div className="border-t border-[var(--border)] pt-6"><Field label="Eerste medewerker" name="staffName" defaultValue="Nok" required hint="Je kunt later meer medewerkers en afwijkende roosters toevoegen." /></div>
        {error ? <p role="alert" className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button size="lg" className="w-full">Salon aanmaken</Button>
      </div>
    </form>
  </main>;
}
