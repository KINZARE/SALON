import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getTodayWorkspace } from "@/services/today-workspace";
import { TodaySummary } from "@/components/workspace/today-summary";
import { TodayTimeline } from "@/components/workspace/today-timeline";
import { AttentionList } from "@/components/workspace/attention-list";
import { QuickActions } from "@/components/workspace/quick-actions";

export default async function TodayPage() {
  const { salon, membership } = await requireAppContext();
  const data = await getTodayWorkspace(salon.id, salon.timezone, { includeWaitlist: membership.role !== "staff" });
  const canManage = ["owner","manager"].includes(membership.role);
  const dateLabel = new Intl.DateTimeFormat("nl-NL",{weekday:"long",day:"numeric",month:"long",timeZone:salon.timezone}).format(new Date());

  return <div data-testid="today-command-centre">
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Vandaag</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.045em] sm:text-[36px]">Je salon vandaag</h1>
        <p className="mt-1 text-sm capitalize text-[var(--muted)]">{dateLabel}</p>
      </div>
      <QuickActions canManage={canManage}/>
    </header>

    <div className="mt-7"><TodaySummary appointmentCount={data.appointmentCount} plannedValueCents={data.plannedValueCents} occupancyPercent={data.occupancyPercent} bookableMinutes={data.bookableMinutes} freeCapacityMinutes={data.freeCapacityMinutes} attentionCount={data.attention.length} currency={salon.currency} staffRole={membership.role==="staff"}/></div>

    <section data-orsira-next-appointment className="mt-5 overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">
      {data.nextAppointment ? <Link href={`/app/appointments/${data.nextAppointment.id}`} className="grid gap-5 p-5 sm:grid-cols-[.7fr_1.3fr] sm:items-end sm:p-7">
        <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Volgende afspraak</p><time className="mt-3 block text-5xl font-semibold leading-none tracking-[-.06em] text-[var(--ink)] tabular-nums">{formatInTimeZone(new Date(data.nextAppointment.starts_at),salon.timezone,"HH:mm")}</time></div>
        <div className="min-w-0 sm:text-right"><p className="truncate text-xl font-semibold">{data.nextAppointment.customer?.name??data.nextAppointment.customer_name_snapshot??"Klant"}</p><p className="mt-1 truncate text-sm text-[var(--muted)]">{data.nextAppointment.service_name_snapshot}{data.nextAppointment.staff?.name?` · ${data.nextAppointment.staff.name}`:""}</p><span className="mt-4 inline-flex rounded-[10px] bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white">Open afspraak →</span></div>
      </Link> : <div className="p-6 sm:p-7"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Volgende afspraak</p><p className="mt-3 text-xl font-semibold">Geen volgende afspraak gepland.</p><p className="mt-1 text-sm text-[var(--muted)]">Gebruik vrije ruimte om een nieuwe afspraak toe te voegen.</p></div>}
    </section>

    <div className="mt-9 grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,.55fr)]">
      <section>
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--muted)]">Planning</p><h2 className="mt-1 text-2xl font-semibold tracking-[-.04em]">Je dag</h2></div><Link href="/app/calendar" className="text-xs font-medium text-[var(--muted)] hover:text-[var(--primary)]">Agenda →</Link></div>
        <TodayTimeline appointments={data.appointments} timezone={salon.timezone}/>
      </section>
      <aside className="grid content-start gap-7">
        <section>
          <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Vrije ruimte</h2><span className="text-[11px] text-[var(--muted)]">vanaf 30 min</span></div>
          <div className="mt-3 overflow-hidden rounded-[14px] border border-[var(--border)] bg-white">
            {data.gaps.length ? data.gaps.slice(0,5).map((gap,index)=><Link key={`${gap.staffId}-${gap.start.toISOString()}`} href="/app/calendar" className={`flex items-center justify-between gap-3 px-4 py-3.5 ${index ? "border-t border-[var(--border)]" : ""}`}><div><p className="text-sm font-semibold">{formatInTimeZone(gap.start,salon.timezone,"HH:mm")}–{formatInTimeZone(gap.end,salon.timezone,"HH:mm")}</p><p className="mt-1 text-xs text-[var(--muted)]">{gap.staffName}</p></div><span className="rounded-[8px] bg-[var(--secondary-soft)] px-2.5 py-1 text-[10px] font-semibold text-[#52664d]">{gap.durationMinutes} min</span></Link>) : <p className="px-4 py-5 text-sm text-[var(--muted)]">Geen vrije blokken van 30 minuten of langer meer vandaag.</p>}
          </div>
        </section>
        <AttentionList items={data.attention}/>
      </aside>
    </div>
  </div>;
}
