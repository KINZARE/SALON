import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getWaitlistEntries } from "@/services/waitlist";
import { cancelWaitlistOfferAction, createWaitlistOfferAction, updateWaitlistStatusAction } from "./actions";

export default async function WaitlistPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  if(membership.role==="staff")return <div><h1 className="text-3xl font-semibold">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">De wachtlijst wordt beheerd door owner of manager.</p></div>;

  const query=await searchParams;
  const entries=await getWaitlistEntries(salon.id);
  const waiting=entries.filter(item=>item.status==="waiting").length;
  const error=typeof query.error==="string"?query.error:null;
  const offered=query.offered==="1";

  return <div data-waitlist-workspace>
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Fill the Gap</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Wachtlijst</h1><p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Laat ORSIRA de eerstvolgende passende plek binnen de klantwens vinden. Een aanbod reserveert de agenda niet.</p></div>
      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[var(--muted)] ring-1 ring-[var(--border)]">{waiting} wachtend</span>
    </header>

    {error?<p role="alert" className="mt-5 rounded-[10px] border border-[#e8c8c3] bg-[#fbefed] px-4 py-3 text-sm text-[var(--danger)]">{error}</p>:null}
    {offered?<p className="mt-5 rounded-[10px] border border-[#d9e5dd] bg-[#f1f7f3] px-4 py-3 text-sm text-[#44624e]">De eerstvolgende geldige plek is als tijdelijk aanbod vastgelegd.</p>:null}

    <div className="mt-7 overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">
      {entries.map((item,index)=>{
        const activeOffer=item.offer?.status==="offered"&&new Date(item.offer.expires_at)>new Date()?item.offer:null;
        const expiredOffer=item.offer?.status==="expired"?item.offer:null;
        return <article key={item.id} className={`grid gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:px-5 ${index?"border-t border-[var(--border)]":""}`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{item.customer_name}</p><span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${item.status==="contacted"?"bg-[#e8f0f2] text-[#48676f]":"bg-[#f7ecd4] text-[#7a5a1f]"}`}>{item.status==="contacted"?"Benaderd":"Wachtend"}</span></div>
            <p className="mt-1 break-words text-sm text-[var(--muted)]">{item.service?.name??"Behandeling"} · {item.requested_from}{item.requested_to!==item.requested_from?` t/m ${item.requested_to}`:""}{item.preferredStaff?.name?` · ${item.preferredStaff.name}`:" · geen voorkeur"}</p>
            <p className="mt-1 truncate text-xs text-[var(--muted)]">{[item.phone,item.email].filter(Boolean).join(" · ")}</p>
            {activeOffer?<div className="mt-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5 text-xs"><p className="font-semibold text-[var(--foreground)]">Aanbod · {formatInTimeZone(new Date(activeOffer.starts_at),salon.timezone,"EEE d MMM · HH:mm")}</p><p className="mt-1 text-[var(--muted)]">Geldig tot {formatInTimeZone(new Date(activeOffer.expires_at),salon.timezone,"EEE d MMM · HH:mm")} · niet gereserveerd</p></div>:expiredOffer?<p className="mt-3 text-xs text-[var(--muted)]">Het vorige aanbod is verlopen. ORSIRA kan opnieuw naar een actuele plek zoeken.</p>:null}
          </div>
          <div className="flex max-w-full flex-wrap gap-2 sm:max-w-[360px] sm:justify-end">
            {item.phone?<a href={`tel:${item.phone}`} className="inline-flex min-h-10 items-center rounded-[10px] border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--surface-soft)]">Bellen</a>:null}
            {item.email?<a href={`mailto:${item.email}`} className="inline-flex min-h-10 items-center rounded-[10px] border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--surface-soft)]">Mailen</a>:null}
            {activeOffer?<form action={cancelWaitlistOfferAction}><input type="hidden" name="offerId" value={activeOffer.id}/><button className="min-h-10 rounded-[10px] border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--surface-soft)]">Trek aanbod in</button></form>:<form action={createWaitlistOfferAction}><input type="hidden" name="id" value={item.id}/><button className="min-h-10 rounded-[10px] bg-[var(--primary)] px-3 text-xs font-medium text-white hover:bg-[var(--primary-dark)]">Bied eerstvolgende plek aan</button></form>}
            {item.status==="waiting"?<form action={updateWaitlistStatusAction}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value="contacted"/><button className="min-h-10 rounded-[10px] border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--surface-soft)]">Markeer benaderd</button></form>:<form action={updateWaitlistStatusAction}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value="waiting"/><button className="min-h-10 rounded-[10px] border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--surface-soft)]">Terug naar wachtend</button></form>}
            <form action={updateWaitlistStatusAction}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value="cancelled"/><button className="min-h-10 px-2 text-xs font-medium text-[var(--danger)]">Verwijder</button></form>
          </div>
        </article>})}
      {!entries.length?<div className="px-5 py-10 text-center"><p className="font-semibold">Niemand wacht op een plek.</p><p className="mt-1 text-sm text-[var(--muted)]">Als een boekingsdag vol is, kan een klant zich daar direct aanmelden.</p></div>:null}
    </div>
  </div>;
}
