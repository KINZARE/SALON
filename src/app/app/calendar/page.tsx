import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getAppointmentsForDate } from "@/services/app-data";
import { EmptyState } from "@/components/ui/empty-state";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const { salon, membership } = await requireAppContext();
  const params = await searchParams;
  const today = formatInTimeZone(new Date(), salon.timezone, "yyyy-MM-dd");
  const date = typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;
  const appointments = await getAppointmentsForDate(salon.id, salon.timezone, date);
  const base = new Date(`${date}T12:00:00Z`);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(base.getTime() + (i - 3) * 86_400_000); return d.toISOString().slice(0,10); });
  return <>
    <header className="flex items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Calendar</h1><p className="mt-1 text-sm text-[var(--muted)]">Dagplanning</p></div>{membership.role !== "staff" ? <Link href="/app/calendar/new" className="rounded-[11px] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white">+ Afspraak</Link> : null}</header>
    <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2">{days.map((value) => { const d=new Date(`${value}T12:00:00Z`); return <Link key={value} href={`/app/calendar?date=${value}`} className={`min-w-[72px] rounded-[11px] border px-3 py-2.5 text-center ${value===date?"border-[var(--primary)] bg-[var(--primary-soft)]":"border-[var(--border)] bg-white"}`}><span className="block text-xs capitalize text-[var(--muted)]">{new Intl.DateTimeFormat("nl-NL",{weekday:"short",timeZone:"UTC"}).format(d)}</span><span className="mt-0.5 block text-sm font-semibold">{new Intl.DateTimeFormat("nl-NL",{day:"numeric",month:"short",timeZone:"UTC"}).format(d)}</span></Link>; })}</div>
    <section className="mt-5">{!appointments.length ? <EmptyState title="Geen afspraken" description="Er zijn voor deze dag nog geen afspraken gepland." {...(membership.role !== "staff" ? { action: "+ Afspraak", href: "/app/calendar/new" } : {})} /> : <div className="relative ml-14 border-l border-[var(--border)]">{appointments.map((item) => <div key={item.id} className="relative pb-4 pl-5"><time className="absolute right-full top-3 mr-4 w-12 text-right text-xs font-medium text-[var(--muted)]">{formatInTimeZone(new Date(item.starts_at), salon.timezone, "HH:mm")}</time><Link href={`/app/appointments/${item.id}`} className="block rounded-[12px] border border-[var(--border)] bg-white px-4 py-3"><div className="flex justify-between gap-3"><p className="font-semibold">{item.customer?.name ?? item.customer_name_snapshot ?? "Klant"}</p><span className="text-xs text-[var(--muted)]">{formatInTimeZone(new Date(item.service_ends_at), salon.timezone, "HH:mm")}</span></div><p className="mt-1 text-sm text-[var(--muted)]">{item.service_name_snapshot}{item.staff?.name?` · ${item.staff.name}`:""}</p></Link></div>)}</div>}</section>
  </>;
}
