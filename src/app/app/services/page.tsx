import { requireAppContext } from "@/lib/auth";
import { getServices } from "@/services/app-data";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { createService, toggleService } from "./actions";

export default async function ServicesPage() {
  const { salon, membership } = await requireAppContext();
  if (membership.role === "staff") return <AccessDenied />;
  const items = await getServices(salon.id);

  return <>
    <header><h1 className="text-3xl font-semibold tracking-[-0.04em]">Services</h1><p className="mt-1 text-sm text-[var(--muted)]">Behandelingen, duur, prijs en online boekbaarheid.</p></header>
    <div className="mt-7 divide-y divide-[var(--border)] border-y border-[var(--border)]">
      {items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0"><p className="truncate font-semibold">{item.name}</p><p className="mt-1 text-sm text-[var(--muted)]">{item.duration_minutes} min · {item.online_bookable ? "Online boekbaar" : "Alleen intern"}{!item.active ? " · Inactief" : ""}</p></div>
        <div className="flex shrink-0 items-center gap-3"><p className="text-sm font-semibold">{formatMoney(item.price_cents, item.currency)}</p>{membership.role === "owner" ? <form action={toggleService}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="active" value={String(item.active)}/><button className="text-xs font-medium text-[var(--muted)] hover:text-black">{item.active ? "Pauzeren" : "Activeren"}</button></form> : null}</div>
      </div>)}
      {!items.length ? <p className="py-8 text-sm text-[var(--muted)]">Nog geen behandelingen.</p> : null}
    </div>

    {membership.role === "owner" ? <section className="mt-10 max-w-xl">
      <h2 className="text-lg font-semibold">Behandeling toevoegen</h2>
      <form action={createService} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Naam" name="name" required maxLength={120}/></div>
        <Field label="Duur (minuten)" name="duration" type="number" min={5} max={720} defaultValue={60} required/>
        <Field label="Prijs (€)" name="price" inputMode="decimal" defaultValue="65,00" required/>
        <Field label="Buffer na afspraak (min)" name="buffer" type="number" min={0} max={180} defaultValue={0} required/>
        <label className="flex min-h-11 items-center gap-3 pt-6 text-sm"><input type="checkbox" name="onlineBookable" defaultChecked className="h-4 w-4"/> Online boekbaar</label>
        <label className="sm:col-span-2 grid gap-1.5 text-sm font-medium"><span>Beschrijving (optioneel)</span><textarea name="description" maxLength={600} rows={3} className="rounded-[11px] border border-[var(--border)] bg-white px-3.5 py-3 outline-none focus:border-[var(--primary)]"/></label>
        <div className="sm:col-span-2"><Button>Behandeling toevoegen</Button></div>
      </form>
    </section> : null}
  </>;
}

function AccessDenied() {
  return <div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Deze pagina is alleen beschikbaar voor owner en manager.</p></div>;
}
