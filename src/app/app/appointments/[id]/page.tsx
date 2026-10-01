import Link from "next/link";
import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/format";
import { transitionAppointmentStatus,updateAppointmentNote } from "./actions";
import { Button } from "@/components/ui/button";

const actions:Record<string,Array<{label:string;status:string;variant?:"primary"|"secondary"|"danger"}>>={
  pending:[{label:"Bevestigen",status:"confirmed"},{label:"Annuleren",status:"cancelled",variant:"danger"}],
  confirmed:[{label:"Check-in",status:"checked_in"},{label:"No-show",status:"no_show",variant:"secondary"},{label:"Annuleren",status:"cancelled",variant:"danger"}],
  checked_in:[{label:"Afronden",status:"completed"},{label:"Annuleren",status:"cancelled",variant:"danger"}],
  completed:[],cancelled:[],no_show:[],
};

export default async function AppointmentPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {id}=await params;const query=await searchParams;const errorMessage=typeof query.error==="string"?query.error:null;
  const {salon,membership}=await requireAppContext();
  const db=createAdminSupabaseClient();
  const result=await db.from("appointments").select("id,customer_id,staff_id,service_id,customer_name_snapshot,starts_at,service_ends_at,status,payment_status,service_name_snapshot,duration_minutes_snapshot,price_cents_snapshot,currency_snapshot,note").eq("id",id).eq("salon_id",salon.id).maybeSingle();
  if(result.error)throw result.error;
  const appointment=result.data;
  let customer:{name:string;phone:string|null;email:string|null}|null=null;
  let staff:{name:string}|null=null;
  if(appointment){
    const [customerResult,staffResult]=await Promise.all([db.from("customers").select("name,phone,email").eq("id",appointment.customer_id).maybeSingle(),db.from("staff").select("name").eq("id",appointment.staff_id).maybeSingle()]);
    if(customerResult.error)throw customerResult.error;if(staffResult.error)throw staffResult.error;customer=customerResult.data;staff=staffResult.data;
  }
  if(!appointment)notFound();
  const canManage=["owner","manager"].includes(membership.role);
  return <>
    <Link href="/app/calendar" className="text-sm text-[var(--muted)]">← Calendar</Link>
    <header className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-[-0.04em]">{customer?.name??appointment.customer_name_snapshot??"Afspraak"}</h1><p className="mt-1 text-sm text-[var(--muted)]">{appointment.service_name_snapshot} · {staff?.name??"Medewerker"}</p></div><span className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium capitalize">{appointment.status.replace("_"," ")}</span></header>
    {errorMessage?<p role="alert" className="mt-5 rounded-[11px] border border-[#f0cbc6] bg-[#fff6f5] p-3.5 text-sm text-[var(--danger)]">{errorMessage}</p>:null}
    <div className="mt-7 max-w-2xl divide-y divide-[var(--border)] border-y border-[var(--border)]">
      <div className="grid grid-cols-2 gap-5 py-5 sm:grid-cols-4"><div><p className="text-xs text-[var(--muted)]">Datum</p><p className="mt-1 text-sm font-semibold">{formatInTimeZone(new Date(appointment.starts_at),salon.timezone,"d MMM yyyy")}</p></div><div><p className="text-xs text-[var(--muted)]">Tijd</p><p className="mt-1 text-sm font-semibold">{formatInTimeZone(new Date(appointment.starts_at),salon.timezone,"HH:mm")}–{formatInTimeZone(new Date(appointment.service_ends_at),salon.timezone,"HH:mm")}</p></div><div><p className="text-xs text-[var(--muted)]">Prijs</p><p className="mt-1 text-sm font-semibold">{formatMoney(appointment.price_cents_snapshot,appointment.currency_snapshot)}</p></div><div><p className="text-xs text-[var(--muted)]">Betaling</p><p className="mt-1 text-sm font-semibold capitalize">{appointment.payment_status.replace("_"," ")}</p></div></div>
      <div className="py-5"><p className="text-xs text-[var(--muted)]">Klant</p><p className="mt-1 font-semibold">{customer?.name??appointment.customer_name_snapshot??"—"}</p><p className="mt-1 text-sm text-[var(--muted)]">{[customer?.phone,customer?.email].filter(Boolean).join(" · ")||"Geen contactgegevens"}</p></div>
      <div className="py-5"><p className="text-xs text-[var(--muted)]">Notitie</p>{canManage?<form action={updateAppointmentNote} className="mt-2"><input type="hidden" name="appointmentId" value={appointment.id}/><textarea name="note" defaultValue={appointment.note??""} maxLength={1000} rows={3} className="w-full rounded-[11px] border border-[var(--border)] bg-white px-3.5 py-3 text-sm"/><Button variant="secondary" className="mt-2">Notitie opslaan</Button></form>:<p className="mt-1 whitespace-pre-wrap text-sm leading-6">{appointment.note||"Geen notitie."}</p>}</div>
    </div>
    {canManage&&!["completed","cancelled","no_show"].includes(appointment.status)?<div className="mt-6 flex flex-wrap gap-2"><Link href={`/app/appointments/${appointment.id}/reschedule`} className="inline-flex h-11 items-center justify-center rounded-[11px] border border-[var(--border)] bg-white px-4 text-sm font-medium">Verplaatsen</Link>{(actions[appointment.status]??[]).map(action=><form key={action.status} action={transitionAppointmentStatus}><input type="hidden" name="appointmentId" value={appointment.id}/><input type="hidden" name="status" value={action.status}/><Button variant={action.variant??"primary"}>{action.label}</Button></form>)}</div>:null}
  </>;
}
