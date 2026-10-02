import { requireAppContext } from "@/lib/auth";
import { getWaitlistEntries } from "@/services/waitlist";
import { updateWaitlistStatus } from "./actions";

export default async function WaitlistPage(){
  const {salon,membership}=await requireAppContext();
  if(membership.role==="staff")return <div><h1 className="text-3xl font-semibold">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">De wachtlijst wordt beheerd door owner of manager.</p></div>;

  const entries=await getWaitlistEntries(salon.id);
  const waiting=entries.filter(item=>item.status==="waiting").length;

  return <div data-waitlist-workspace>
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Fill the Gap</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Wachtlijst</h1><p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Mensen die op een concrete dag willen komen als er een passende plek vrijkomt.</p></div>
      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[var(--muted)] ring-1 ring-[var(--border)]">{waiting} wachtend</span>
    </header>

    <div className="mt-7 overflow-hidden rounded-[24px] border border-[var(--border)] bg-white">
      {entries.map((item,index)=><article key={item.id} className={`grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5 ${index?"border-t border-[var(--border)]":""}`}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.customer_name}</p><span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${item.status==="contacted"?"bg-[#e8f0f2] text-[#48676f]":"bg-[#f7ecd4] text-[#7a5a1f]"}`}>{item.status==="contacted"?"Benaderd":"Wachtend"}</span></div>
          <p className="mt-1 text-sm text-[var(--muted)]">{item.service?.name??"Behandeling"} · {item.requested_from}{item.preferredStaff?.name?` · ${item.preferredStaff.name}`:" · geen voorkeur"}</p>
          <p className="mt-1 truncate text-xs text-[var(--muted)]">{[item.phone,item.email].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {item.phone?<a href={`tel:${item.phone}`} className="inline-flex min-h-10 items-center rounded-[12px] border border-[var(--border)] px-3 text-xs font-medium">Bellen</a>:null}
          {item.email?<a href={`mailto:${item.email}`} className="inline-flex min-h-10 items-center rounded-[12px] border border-[var(--border)] px-3 text-xs font-medium">Mailen</a>:null}
          {item.status==="waiting"?<form action={updateWaitlistStatus}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value="contacted"/><button className="min-h-10 rounded-[12px] bg-[var(--ink)] px-3 text-xs font-medium text-white">Markeer benaderd</button></form>:<form action={updateWaitlistStatus}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value="waiting"/><button className="min-h-10 rounded-[12px] border border-[var(--border)] px-3 text-xs font-medium">Terug naar wachtend</button></form>}
          <form action={updateWaitlistStatus}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value="cancelled"/><button className="min-h-10 px-2 text-xs font-medium text-[var(--danger)]">Verwijder</button></form>
        </div>
      </article>)}
      {!entries.length?<div className="px-5 py-10 text-center"><p className="font-semibold">Niemand wacht op een plek.</p><p className="mt-1 text-sm text-[var(--muted)]">Als een boekingsdag vol is, kan een klant zich daar direct aanmelden.</p></div>:null}
    </div>
  </div>;
}
