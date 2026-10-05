import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/format";
import { transitionAppointmentStatus,updateAppointmentNote } from "./actions";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { SelfServiceLinkButton } from "@/components/workspace/self-service-link-button";
import { IntakeLinkButton } from "@/components/workspace/intake-link-button";
import { getAppointmentIntakeState } from "@/services/intake";

const actions:Record<string,Array<{label:string;status:string;variant?:"primary"|"secondary"|"danger"}>>={
  pending:[{label:"Bevestigen",status:"confirmed"}],
  confirmed:[{label:"Check-in",status:"checked_in",variant:"secondary"}],
  checked_in:[{label:"Afronden",status:"completed"}],
  completed:[],cancelled:[],no_show:[],
};

export default async function AppointmentPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {id}=await params;
  const query=await searchParams;
  const errorMessage=typeof query.error==="string"?query.error:null;
  const {salon,membership}=await requireAppContext();
  const db=createAdminSupabaseClient();
  const result=await db.from("appointments").select("id,customer_id,staff_id,service_id,customer_name_snapshot,starts_at,service_ends_at,status,payment_status,service_name_snapshot,duration_minutes_snapshot,price_cents_snapshot,currency_snapshot,note").eq("id",id).eq("salon_id",salon.id).maybeSingle();
  if(result.error)throw result.error;
  const appointment=result.data;

  let customer:{name:string;phone:string|null;email:string|null}|null=null;
  let staff:{name:string}|null=null;
  if(appointment){
    const [customerResult,staffResult]=await Promise.all([
      db.from("customers").select("name,phone,email").eq("id",appointment.customer_id).eq("salon_id",salon.id).maybeSingle(),
      db.from("staff").select("name").eq("id",appointment.staff_id).eq("salon_id",salon.id).maybeSingle(),
    ]);
    if(customerResult.error)throw customerResult.error;
    if(staffResult.error)throw staffResult.error;
    customer=customerResult.data;
    staff=staffResult.data;
  }
  if(!appointment)notFound();

  const canManage=["owner","manager"].includes(membership.role);
  const intake=canManage?await getAppointmentIntakeState(salon.id,appointment.id,appointment.service_id):{forms:[],submissions:[]};
  const start=formatInTimeZone(new Date(appointment.starts_at),salon.timezone,"HH:mm");
  const end=formatInTimeZone(new Date(appointment.service_ends_at),salon.timezone,"HH:mm");
  const date=formatInTimeZone(new Date(appointment.starts_at),salon.timezone,"EEEE d MMMM yyyy");

  return <div data-appointment-action-centre>
    <Link href="/app/calendar" className="text-sm text-[var(--muted)] hover:text-[var(--primary)]">← Agenda</Link>

    <header className="mt-5 grid gap-5 rounded-[16px] border border-[var(--border)] bg-white p-5 sm:grid-cols-[.8fr_1.2fr] sm:items-end sm:p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">{date}</p>
        <p className="mt-3 text-5xl font-semibold tracking-[-.06em] tabular-nums text-[var(--ink)] sm:text-6xl">{start}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">tot {end} · {appointment.duration_minutes_snapshot} min</p>
      </div>
      <div className="min-w-0 sm:text-right">
        <div className="sm:flex sm:justify-end"><StatusChip status={appointment.status}/></div>
        <h1 className="mt-3 truncate text-2xl font-semibold tracking-[-.04em] sm:text-3xl">{customer?.name??appointment.customer_name_snapshot??"Afspraak"}</h1>
        <p className="mt-1 truncate text-sm text-[var(--muted)]">{appointment.service_name_snapshot} · {staff?.name??"Medewerker"}</p>
      </div>
    </header>

    {errorMessage?<p role="alert" className="mt-5 rounded-[10px] border border-[#e8c8c3] bg-[#fbefed] p-3.5 text-sm text-[var(--danger)]">{errorMessage}</p>:null}

    {canManage&&![ "completed","cancelled","no_show" ].includes(appointment.status)?<section className="mt-5 flex flex-wrap items-center gap-2">
      <Link href={`/app/appointments/${appointment.id}/reschedule`} className="inline-flex h-11 items-center justify-center rounded-[10px] bg-[var(--primary)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-dark)]">Verplaatsen</Link>
      {(actions[appointment.status]??[]).map(action=><form key={action.status} action={transitionAppointmentStatus}><input type="hidden" name="appointmentId" value={appointment.id}/><input type="hidden" name="status" value={action.status}/><Button variant={action.variant??"secondary"}>{action.label}</Button></form>)}
      <details className="w-full">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-[var(--muted)]">Meer acties</summary>
        <div className="flex flex-wrap gap-2">      {appointment.status==="confirmed"?<form action={transitionAppointmentStatus}><input type="hidden" name="appointmentId" value={appointment.id}/><input type="hidden" name="status" value="no_show"/><ConfirmButton variant="ghost" message="Deze afspraak als no-show markeren?">No-show</ConfirmButton></form>:null}
      <form action={transitionAppointmentStatus}><input type="hidden" name="appointmentId" value={appointment.id}/><input type="hidden" name="status" value="cancelled"/><ConfirmButton message="Deze afspraak annuleren?">Annuleren</ConfirmButton></form>
      <SelfServiceLinkButton appointmentId={appointment.id}/>
      <IntakeLinkButton appointmentId={appointment.id} forms={intake.forms.map(form=>({id:form.id,title:form.title}))}/>
        </div>
      </details>
    </section>:null}

    {canManage&&intake.forms.length?<section className="mt-4 rounded-[12px] border border-[var(--border)] bg-white px-4 py-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Intake</p><p className="text-xs text-[var(--muted)]">{intake.submissions.length?`${intake.submissions.length} ontvangen`:"Nog niet ontvangen"}</p></div></section>:null}

    <div className="mt-8 grid gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)]">
      <section className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">
        <div className="grid grid-cols-2 gap-5 p-5 sm:grid-cols-3">
          <div><p className="text-xs text-[var(--muted)]">Behandeling</p><p className="mt-1 text-sm font-semibold">{appointment.service_name_snapshot}</p></div>
          <div><p className="text-xs text-[var(--muted)]">Prijs</p><p className="mt-1 text-sm font-semibold">{formatMoney(appointment.price_cents_snapshot,appointment.currency_snapshot)}</p></div>
          <div><p className="text-xs text-[var(--muted)]">Betaling</p><p className="mt-1 text-sm font-semibold capitalize">{appointment.payment_status.replaceAll("_"," ")}</p></div>
        </div>
        <div className="border-t border-[var(--border)] p-5">
          <p className="text-xs text-[var(--muted)]">Notitie</p>
          {canManage?<form action={updateAppointmentNote} className="mt-2"><input type="hidden" name="appointmentId" value={appointment.id}/><textarea aria-label="Afspraaknotitie" name="note" defaultValue={appointment.note??""} maxLength={1000} rows={4} className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--background)] px-3.5 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]"/><Button variant="secondary" className="mt-2">Notitie opslaan</Button></form>:<p className="mt-2 whitespace-pre-wrap text-sm leading-6">{appointment.note||"Geen notitie."}</p>}
        </div>
      </section>

      <aside className="rounded-[16px] border border-[var(--border)] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--muted)]">Klant</p>
        <p className="mt-2 text-lg font-semibold">{customer?.name??appointment.customer_name_snapshot??"—"}</p>
        <p className="mt-1 break-words text-sm leading-6 text-[var(--muted)]">{[customer?.phone,customer?.email].filter(Boolean).join(" · ")||"Geen contactgegevens"}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {customer?.phone?<a href={`tel:${customer.phone}`} className="inline-flex min-h-10 items-center rounded-[10px] border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--surface-soft)]">Bellen</a>:null}
          {canManage?<Link href={`/app/customers/${appointment.customer_id}`} className="inline-flex min-h-10 items-center rounded-[10px] border border-[var(--border)] px-3 text-xs font-medium hover:bg-[var(--surface-soft)]">Open klant</Link>:null}
        </div>
      </aside>
    </div>
  </div>;
}
