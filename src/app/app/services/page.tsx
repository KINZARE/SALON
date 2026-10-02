import { requireAppContext } from "@/lib/auth";
import { getWorkspaceServices } from "@/services/workspace-data";
import { getStaff } from "@/services/app-data";
import { formatMoney } from "@/lib/format";
import { ServiceEditor } from "@/components/workspace/service-editor";
import { saveService } from "./actions";

export default async function ServicesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  if(membership.role==="staff")return <AccessDenied/>;
  const [items,staff,query]=await Promise.all([getWorkspaceServices(salon.id),getStaff(salon.id),searchParams]);
  const error=typeof query.error==="string"?query.error:null;
  const canManage=["owner","manager"].includes(membership.role);

  return <div data-services-workspace>
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Services</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Behandelingen</h1><p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Prijs, duur, buffer, online boekbaarheid en wie de behandeling uitvoert.</p></div>
      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[var(--muted)] ring-1 ring-[var(--border)]">{items.filter(item=>item.active).length} actief</span>
    </header>
    {error?<p role="alert" className="mt-5 rounded-[14px] border border-[#e8c8c3] bg-[#fbefed] p-3.5 text-sm text-[var(--danger)]">{error}</p>:null}

    <div className="mt-7 grid gap-3">
      {items.map(item=><details key={item.id} className="group overflow-hidden rounded-[22px] border border-[var(--border)] bg-white">
        <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5">
          <div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><p className="truncate font-semibold">{item.name}</p>{!item.active?<span className="rounded-full bg-[#efeeeb] px-2 py-0.5 text-[9px] font-semibold text-[#77736d]">Inactief</span>:null}</div><p className="mt-1 truncate text-sm text-[var(--muted)]">{item.duration_minutes} min · {item.buffer_minutes} min buffer · {item.online_bookable?"Online boekbaar":"Alleen intern"} · {item.staff_ids.length} medewerkers</p></div>
          <p className="shrink-0 text-sm font-semibold">{formatMoney(item.price_cents,item.currency)}</p>
          <span className="text-[var(--muted)] transition group-open:rotate-180" aria-hidden>⌄</span>
        </summary>
        {canManage?<div className="border-t border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5"><ServiceEditor item={item} staff={staff} action={saveService}/></div>:null}
      </details>)}
      {!items.length?<div className="rounded-[22px] border border-dashed border-[var(--border-strong)] bg-white p-8 text-center"><p className="font-semibold">Nog geen behandelingen</p><p className="mt-1 text-sm text-[var(--muted)]">Voeg de eerste behandeling hieronder toe.</p></div>:null}
    </div>

    {canManage?<section className="mt-10 max-w-3xl"><div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--muted)]">Nieuw</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Behandeling toevoegen</h2></div><ServiceEditor staff={staff} action={saveService}/></section>:null}
  </div>;
}

function AccessDenied(){return <div><h1 className="text-3xl font-semibold">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Services worden beheerd door owner of manager.</p></div>}
