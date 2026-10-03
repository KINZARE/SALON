import { requireAppContext } from "@/lib/auth";
import { getWorkspaceStaff } from "@/services/workspace-data";
import { getServices } from "@/services/app-data";
import { getStaffIdentity, type StaffTone } from "@/lib/staff-identity";
import { StaffEditor } from "@/components/workspace/staff-editor";
import { saveStaff } from "./actions";

const avatarClass:Record<StaffTone,string>={
  clay:"bg-[#f3e9e7] text-[#74424a]",
  sage:"bg-[var(--secondary-soft)] text-[#52664d]",
  sand:"bg-[var(--surface-soft)] text-[#706257]",
  sky:"bg-[#edf1f0] text-[#596968]",
  lilac:"bg-[#f1ecef] text-[#6f5863]",
};

export default async function StaffPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  if(membership.role==="staff")return <AccessDenied/>;
  const [items,services,query]=await Promise.all([getWorkspaceStaff(salon.id),getServices(salon.id),searchParams]);
  const error=typeof query.error==="string"?query.error:null;

  return <div data-staff-workspace>
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Team</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-[36px]">Mensen & beschikbaarheid</h1><p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">Beheer wie werkt, welke behandelingen ze doen en wanneer ze beschikbaar zijn.</p></div>
      <span className="rounded-[8px] border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--muted)]">{items.filter(item=>item.active).length} actief</span>
    </header>
    {error?<p role="alert" className="mt-5 rounded-[10px] border border-[#e8c8c3] bg-[#fbefed] p-3.5 text-sm text-[var(--danger)]">{error}</p>:null}

    <div className="mt-7 grid gap-2">
      {items.map(item=>{
        const identity=getStaffIdentity(item.id,item.name);
        const workingDays=item.schedules.filter(row=>row.is_working).length;
        return <details key={item.id} className="group overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 sm:px-5">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[10px] text-xs font-bold ${avatarClass[identity.tone]}`}>{identity.initials}</span>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.name}</p><p className="mt-1 truncate text-sm text-[var(--muted)]">{item.operational_role} · {item.service_ids.length} behandelingen · {workingDays} werkdagen</p></div>
            <span className={`shrink-0 rounded-[8px] px-2.5 py-1 text-[10px] font-semibold ${item.active?"bg-[var(--secondary-soft)] text-[#52664d]":"bg-[#efeeeb] text-[#77736d]"}`}>{item.active?"Actief":"Inactief"}</span>
            <span className="ml-1 text-[var(--muted)] transition group-open:rotate-180" aria-hidden>⌄</span>
          </summary>
          <div className="border-t border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5"><StaffEditor item={item} services={services} action={saveStaff}/></div>
        </details>;
      })}
      {!items.length?<div className="rounded-[16px] border border-dashed border-[var(--border-strong)] bg-white p-8 text-center"><p className="font-semibold">Nog geen medewerkers</p><p className="mt-1 text-sm text-[var(--muted)]">Voeg de eerste medewerker hieronder toe.</p></div>:null}
    </div>

    <section className="mt-10 max-w-4xl">
      <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Nieuw</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Medewerker toevoegen</h2></div>
      <StaffEditor services={services} action={saveStaff}/>
    </section>
  </div>;
}

function AccessDenied(){return <div><h1 className="text-3xl font-semibold">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Teambeheer is alleen beschikbaar voor owner en manager.</p></div>}
