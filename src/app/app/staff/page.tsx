import { requireAppContext } from "@/lib/auth";
import { getServices, getStaff } from "@/services/app-data";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { createStaff, toggleStaff } from "./actions";

const days = [[1,"Ma"],[2,"Di"],[3,"Wo"],[4,"Do"],[5,"Vr"],[6,"Za"],[0,"Zo"]] as const;

export default async function StaffPage() {
  const { salon, membership } = await requireAppContext();
  if (membership.role === "staff") return <AccessDenied />;
  const [items, services] = await Promise.all([getStaff(salon.id), getServices(salon.id)]);
  const activeServices = services.filter((service) => service.active);

  return <>
    <header><h1 className="text-3xl font-semibold tracking-[-0.04em]">Staff</h1><p className="mt-1 text-sm text-[var(--muted)]">Medewerkers, behandelingen en standaard rooster.</p></header>
    <div className="mt-7 divide-y divide-[var(--border)] border-y border-[var(--border)]">
      {items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold">{item.name}</p><p className="mt-1 text-sm text-[var(--muted)]">{item.active ? "Actief" : "Inactief"}</p></div>{membership.role === "owner" ? <form action={toggleStaff}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="active" value={String(item.active)}/><button className="text-xs font-medium text-[var(--muted)] hover:text-black">{item.active ? "Pauzeren" : "Activeren"}</button></form> : null}</div>)}
      {!items.length ? <p className="py-8 text-sm text-[var(--muted)]">Nog geen medewerkers.</p> : null}
    </div>

    {membership.role === "owner" ? <section className="mt-10 max-w-xl">
      <h2 className="text-lg font-semibold">Medewerker toevoegen</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">Gebruik een normaal weekrooster. Afwijkingen en vrije tijd regel je met blocks.</p>
      <form action={createStaff} className="mt-5 grid gap-5">
        <Field label="Naam" name="name" required maxLength={120}/>
        <div><p className="mb-2 text-sm font-medium">Behandelingen</p><div className="grid gap-2 sm:grid-cols-2">{activeServices.map((service) => <label key={service.id} className="flex min-h-11 items-center gap-3 rounded-[10px] border border-[var(--border)] px-3 text-sm"><input type="checkbox" name="serviceIds" value={service.id} className="h-4 w-4"/> {service.name}</label>)}</div>{!activeServices.length ? <p className="text-sm text-[var(--muted)]">Maak eerst een actieve behandeling aan.</p> : null}</div>
        <div><p className="mb-2 text-sm font-medium">Werkdagen</p><div className="flex flex-wrap gap-2">{days.map(([value,label]) => <label key={value} className="cursor-pointer"><input className="peer sr-only" type="checkbox" name="weekdays" value={value} defaultChecked={value !== 0}/><span className="flex h-10 min-w-11 items-center justify-center rounded-[10px] border border-[var(--border)] px-3 text-sm peer-checked:border-[var(--primary)] peer-checked:bg-[var(--primary-soft)]">{label}</span></label>)}</div></div>
        <div className="grid grid-cols-2 gap-3"><Field label="Start" name="startTime" type="time" defaultValue="09:00" required/><Field label="Einde" name="endTime" type="time" defaultValue="18:00" required/></div>
        <div><Button disabled={!activeServices.length}>Medewerker toevoegen</Button></div>
      </form>
    </section> : null}
  </>;
}

function AccessDenied() {
  return <div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Deze pagina is alleen beschikbaar voor owner en manager.</p></div>;
}
