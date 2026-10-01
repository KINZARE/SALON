import { requireAppContext } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { getBookingSettings, getOpeningHours, getSalonProfile } from "@/services/app-data";
import { updateBookingSettings, updateOpeningHours, updateSalonProfile } from "./actions";

const dayLabels: Record<number, string> = { 0: "Zondag", 1: "Maandag", 2: "Dinsdag", 3: "Woensdag", 4: "Donderdag", 5: "Vrijdag", 6: "Zaterdag" };
const dayOrder = [1,2,3,4,5,6,0];
const shortTime = (value: string | null) => value?.slice(0,5) ?? "";

export default async function SettingsPage() {
  const { salon, user, membership } = await requireAppContext();
  const [profile, booking, opening] = await Promise.all([getSalonProfile(salon.id), getBookingSettings(salon.id), getOpeningHours(salon.id)]);
  const openingMap = new Map(opening.map((row) => [row.weekday, row]));
  const owner = membership.role === "owner";

  return <>
    <header><h1 className="text-3xl font-semibold tracking-[-0.04em]">Settings</h1><p className="mt-1 text-sm text-[var(--muted)]">Configuratie buiten de dagelijkse workflow.</p></header>

    <section className="mt-8 max-w-2xl border-t border-[var(--border)] pt-6">
      <h2 className="text-lg font-semibold">Salon</h2>
      {owner ? <form action={updateSalonProfile} className="mt-4 grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Naam" name="name" defaultValue={profile.name} required maxLength={120}/></div><Field label="Telefoon" name="phone" defaultValue={profile.phone ?? ""}/><Field label="E-mail" name="email" type="email" defaultValue={profile.email ?? ""}/><div className="sm:col-span-2"><Field label="Adres" name="address" defaultValue={profile.address ?? ""}/></div><p className="sm:col-span-2 text-xs text-[var(--muted)]">Timezone {profile.timezone} · Valuta {profile.currency}</p><div className="sm:col-span-2"><Button variant="secondary">Salon opslaan</Button></div></form> : <div className="mt-3 text-sm"><p className="font-medium">{profile.name}</p><p className="mt-1 text-[var(--muted)]">{profile.timezone} · {profile.currency}</p></div>}
    </section>

    <section className="mt-9 max-w-2xl border-t border-[var(--border)] pt-6">
      <h2 className="text-lg font-semibold">Openingstijden</h2>
      {owner ? <form action={updateOpeningHours} className="mt-4 grid gap-3">{dayOrder.map((weekday) => { const row = openingMap.get(weekday); const isOpen = row?.is_open ?? false; return <div key={weekday} className="grid grid-cols-[1fr_88px_88px] items-center gap-2 sm:grid-cols-[140px_1fr_1fr]"><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name={`open-${weekday}`} defaultChecked={isOpen} className="h-4 w-4"/>{dayLabels[weekday]}</label><input aria-label={`${dayLabels[weekday]} open`} type="time" name={`start-${weekday}`} defaultValue={shortTime(row?.start_time ?? null) || "09:00"} className="h-10 rounded-[9px] border border-[var(--border)] px-2 text-sm"/><input aria-label={`${dayLabels[weekday]} dicht`} type="time" name={`end-${weekday}`} defaultValue={shortTime(row?.end_time ?? null) || "18:00"} className="h-10 rounded-[9px] border border-[var(--border)] px-2 text-sm"/></div>; })}<div className="mt-2"><Button variant="secondary">Openingstijden opslaan</Button></div></form> : <div className="mt-3 divide-y divide-[var(--border)]">{dayOrder.map((weekday) => { const row=openingMap.get(weekday); return <div key={weekday} className="flex justify-between py-2 text-sm"><span>{dayLabels[weekday]}</span><span className="text-[var(--muted)]">{row?.is_open ? `${shortTime(row.start_time)}–${shortTime(row.end_time)}` : "Gesloten"}</span></div>; })}</div>}
    </section>

    <section className="mt-9 max-w-2xl border-t border-[var(--border)] pt-6">
      <h2 className="text-lg font-semibold">Booking</h2>
      {owner ? <form action={updateBookingSettings} className="mt-4 grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium"><span>Slotinterval</span><select name="slotInterval" defaultValue={booking.slot_interval_minutes} className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5">{[5,10,15,20,30,60].map((value)=><option key={value} value={value}>{value} min</option>)}</select></label><Field label="Minimaal vooraf boeken (min)" name="minLead" type="number" min={0} defaultValue={booking.min_lead_minutes} required/><Field label="Max. dagen vooruit" name="maxDays" type="number" min={1} max={365} defaultValue={booking.max_days_ahead} required/><Field label="Annuleringstermijn (uur)" name="cancellationHours" type="number" min={0} defaultValue={booking.cancellation_hours} required/><label className="sm:col-span-2 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="allowStaffChoice" defaultChecked={booking.allow_staff_choice} className="h-4 w-4"/> Klant mag een specifieke medewerker kiezen</label><div className="sm:col-span-2"><Button variant="secondary">Booking opslaan</Button></div></form> : <p className="mt-3 text-sm text-[var(--muted)]">Bookinginstellingen kunnen alleen door de owner worden aangepast.</p>}
    </section>

    <section className="mt-9 max-w-2xl border-y border-[var(--border)] py-6"><p className="text-sm text-[var(--muted)]">Publieke booking</p><a href={`/book/${salon.slug}`} target="_blank" rel="noreferrer" className="mt-1 inline-block font-medium text-[var(--primary)]">/book/{salon.slug} ↗</a></section>
    <section className="mt-6"><p className="text-sm text-[var(--muted)]">Account</p><p className="mt-1 font-medium">{user.email}</p><p className="mt-1 text-xs uppercase tracking-wide text-[var(--muted)]">{membership.role}</p><form action={signOut} className="mt-5"><Button variant="secondary">Uitloggen</Button></form></section>
  </>;
}
