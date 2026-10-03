import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { getStaffIdentity, type StaffTone } from "@/lib/staff-identity";

const days=[[1,"Maandag"],[2,"Dinsdag"],[3,"Woensdag"],[4,"Donderdag"],[5,"Vrijdag"],[6,"Zaterdag"],[0,"Zondag"]] as const;
type Service={id:string;name:string;active:boolean};
type Schedule={weekday:number;is_working:boolean;start_time:string|null;end_time:string|null};
type Break={weekday:number;start_time:string;end_time:string};
type StaffItem={id:string;name:string;email:string|null;operational_role:string;active:boolean;service_ids:string[];schedules:Schedule[];breaks:Break[]};
const avatarClass:Record<StaffTone,string>={clay:"bg-[#f4e4da] text-[#8a4a25]",sage:"bg-[#e4ece6] text-[#4f6c57]",sand:"bg-[#f2eadc] text-[#80683f]",sky:"bg-[#e4ecef] text-[#4f7078]",lilac:"bg-[#ece6ef] text-[#6e5d78]"};

export function StaffEditor({item,services,action}:{item?:StaffItem;services:Service[];action:(formData:FormData)=>void|Promise<void>}){
  const schedule=new Map(item?.schedules.map(row=>[row.weekday,row])??[]);
  const breaks=new Map(item?.breaks.map(row=>[row.weekday,row])??[]);
  const identity=item?getStaffIdentity(item.id,item.name):null;
  const selectClass="h-11 rounded-[10px] border border-[var(--border)] bg-white px-3.5 outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]";
  const timeClass="h-10 rounded-[10px] border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]";

  return <form data-staff-editor action={action} className="grid min-w-0 gap-6">
    {item?<input type="hidden" name="id" value={item.id}/>:null}
    <section className="grid gap-4 rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">{identity?<span className={`grid h-10 w-10 place-items-center rounded-full text-xs font-bold ${avatarClass[identity.tone]}`}>{identity.initials}</span>:<span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">+</span>}<div><h3 className="font-semibold">{item?"Profiel":"Nieuwe medewerker"}</h3><p className="mt-0.5 text-xs text-[var(--muted)]">Persoon, rol en toegang tot behandelingen.</p></div></div>
      <div className="grid gap-4 sm:grid-cols-3"><Field label="Naam" name="name" required maxLength={120} defaultValue={item?.name??""}/><Field label="E-mail (optioneel)" name="email" type="email" defaultValue={item?.email??""}/><label className="grid gap-1.5 text-sm font-medium"><span>Operationele rol</span><select name="role" defaultValue={item?.operational_role??"staff"} className={selectClass}><option value="staff">Medewerker</option><option value="manager">Manager</option><option value="owner">Owner</option></select></label></div>
      <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="active" defaultChecked={item?.active??true}/> Actief inzetbaar</label>
    </section>

    <section className="rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-5"><div><h3 className="font-semibold">Behandelingen</h3><p className="mt-1 text-xs text-[var(--muted)]">Kies wat deze medewerker kan uitvoeren.</p></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{services.filter(service=>service.active||item?.service_ids.includes(service.id)).map(service=><label key={service.id} className="flex min-h-11 items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface-soft)] px-3 text-sm"><input type="checkbox" name="serviceIds" value={service.id} defaultChecked={item?.service_ids.includes(service.id)??false}/><span className="min-w-0 break-words">{service.name}</span></label>)}</div></section>

    <section className="rounded-[16px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div><h3 className="font-semibold">Weekrooster & pauzes</h3><p className="mt-1 text-xs text-[var(--muted)]">Werkdagen en vaste pauzes zonder horizontale spreadsheet.</p></div>
      <div data-mobile-staff-schedule className="mt-4 divide-y divide-[var(--border)] border-y border-[var(--border)]">
        {days.map(([weekday,label])=>{const row=schedule.get(weekday);const pause=breaks.get(weekday);const working=row?.is_working??(weekday!==0);return <div key={weekday} className="grid gap-3 py-3 lg:grid-cols-[150px_repeat(4,minmax(105px,1fr))] lg:items-end">
          <label className="flex min-h-10 items-center gap-2 text-sm font-semibold"><input type="checkbox" name={`working-${weekday}`} defaultChecked={working}/>{label}</label>
          <label className="grid gap-1 text-xs font-medium text-[var(--muted)]"><span>Start</span><input aria-label={`${label} start`} type="time" name={`start-${weekday}`} defaultValue={row?.start_time?.slice(0,5)??"09:00"} className={timeClass}/></label>
          <label className="grid gap-1 text-xs font-medium text-[var(--muted)]"><span>Einde</span><input aria-label={`${label} einde`} type="time" name={`end-${weekday}`} defaultValue={row?.end_time?.slice(0,5)??"18:00"} className={timeClass}/></label>
          <label className="grid gap-1 text-xs font-medium text-[var(--muted)]"><span>Pauze vanaf</span><input aria-label={`${label} pauze start`} type="time" name={`break-start-${weekday}`} defaultValue={pause?.start_time?.slice(0,5)??""} className={timeClass}/></label>
          <label className="grid gap-1 text-xs font-medium text-[var(--muted)]"><span>Pauze tot</span><input aria-label={`${label} pauze einde`} type="time" name={`break-end-${weekday}`} defaultValue={pause?.end_time?.slice(0,5)??""} className={timeClass}/></label>
        </div>})}
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Laat pauzevelden leeg als er geen vaste pauze is. Bestaande afspraken blijven server-side beschermd.</p>
    </section>
    <div><Button variant={item?"secondary":"primary"} size="lg">{item?"Wijzigingen opslaan":"Medewerker toevoegen"}</Button></div>
  </form>;
}
