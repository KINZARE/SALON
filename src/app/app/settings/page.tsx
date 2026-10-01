import { requireAppContext } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { getBookingSettings,getOpeningHours,getSalonProfile } from "@/services/app-data";
import { saveSettings } from "./actions";

const labels:Record<number,string>={0:"Zondag",1:"Maandag",2:"Dinsdag",3:"Woensdag",4:"Donderdag",5:"Vrijdag",6:"Zaterdag"};
const order=[1,2,3,4,5,6,0];
const short=(value:string|null)=>value?.slice(0,5)??"";

export default async function SettingsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,user,membership}=await requireAppContext();
  const [profile,booking,opening,query]=await Promise.all([getSalonProfile(salon.id),getBookingSettings(salon.id),getOpeningHours(salon.id),searchParams]);
  const map=new Map(opening.map(row=>[row.weekday,row]));
  const canManage=["owner","manager"].includes(membership.role);
  const error=typeof query.error==="string"?query.error:null;
  return <>
    <header><h1 className="text-3xl font-semibold tracking-[-0.04em]">Settings</h1><p className="mt-1 text-sm text-[var(--muted)]">Salon, openingstijden en bookingregels als één gecontroleerde wijziging.</p></header>
    {error?<p role="alert" className="mt-5 rounded-[10px] border border-[#efc7c2] bg-[#fff5f4] p-3 text-sm text-[var(--danger)]">{error}</p>:null}
    {canManage?<form action={saveSettings} className="mt-8 max-w-3xl">
      <section><h2 className="text-lg font-semibold">Salon</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Naam" name="name" defaultValue={profile.name} required maxLength={120}/></div>
        <Field label="Telefoon" name="phone" defaultValue={profile.phone??""}/><Field label="E-mail" name="email" type="email" defaultValue={profile.email??""}/>
        <div className="sm:col-span-2"><Field label="Adres" name="address" defaultValue={profile.address??""}/></div>
        <p className="sm:col-span-2 text-xs text-[var(--muted)]">Timezone {profile.timezone} · Valuta {profile.currency}</p>
      </div></section>
      <section className="mt-9 border-t border-[var(--border)] pt-6"><h2 className="text-lg font-semibold">Openingstijden</h2><div className="mt-4 grid gap-3">
        {order.map(weekday=>{const row=map.get(weekday);const open=row?.is_open??false;return <div key={weekday} className="grid grid-cols-[1fr_88px_88px] items-center gap-2 sm:grid-cols-[140px_1fr_1fr]"><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name={`open-${weekday}`} defaultChecked={open}/>{labels[weekday]}</label><input aria-label={`${labels[weekday]} open`} type="time" name={`start-${weekday}`} defaultValue={short(row?.start_time??null)||"09:00"} className="h-10 rounded-[9px] border border-[var(--border)] px-2"/><input aria-label={`${labels[weekday]} dicht`} type="time" name={`end-${weekday}`} defaultValue={short(row?.end_time??null)||"18:00"} className="h-10 rounded-[9px] border border-[var(--border)] px-2"/></div>})}
      </div></section>
      <section className="mt-9 border-t border-[var(--border)] pt-6"><h2 className="text-lg font-semibold">Booking</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium"><span>Slotinterval</span><select name="slotInterval" defaultValue={booking.slot_interval_minutes} className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5">{[5,10,15,20,30,60].map(value=><option key={value} value={value}>{value} min</option>)}</select></label>
        <Field label="Minimaal vooraf boeken (min)" name="minLead" type="number" min={0} defaultValue={booking.min_lead_minutes} required/>
        <Field label="Max. dagen vooruit" name="maxDays" type="number" min={1} max={365} defaultValue={booking.max_days_ahead} required/>
        <Field label="Annuleringstermijn (uur)" name="cancellationHours" type="number" min={0} defaultValue={booking.cancellation_hours} required/>
        <label className="sm:col-span-2 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="allowStaffChoice" defaultChecked={booking.allow_staff_choice}/> Klant mag medewerker kiezen</label>
      </div></section>
      <div className="mt-7"><Button size="lg">Instellingen opslaan</Button></div>
    </form>:<div className="mt-8 max-w-2xl text-sm"><p className="font-semibold">{profile.name}</p><p className="mt-1 text-[var(--muted)]">{profile.timezone} · {profile.currency}</p><p className="mt-5 text-[var(--muted)]">Alleen owner of manager kan operationele instellingen wijzigen.</p></div>}
    <section className="mt-10 max-w-3xl border-t border-[var(--border)] py-6"><p className="text-sm text-[var(--muted)]">Publieke booking</p><a href={`/book/${salon.slug}`} target="_blank" rel="noreferrer" className="mt-1 inline-block font-medium text-[var(--primary)]">/book/{salon.slug} ↗</a></section>
    <section className="mt-2"><p className="text-sm text-[var(--muted)]">Account</p><p className="mt-1 font-medium">{user.email}</p><p className="mt-1 text-xs uppercase tracking-wide text-[var(--muted)]">{membership.role}</p><form action={signOut} className="mt-5"><Button variant="secondary">Uitloggen</Button></form></section>
  </>;
}
