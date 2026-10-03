import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { getStatusMeta } from "@/lib/calendar-ui";
import type { TodayAppointment } from "@/services/today-workspace";

const statusClass = {
  info: "bg-[#e8f0f2] text-[#48676f]",
  warning: "bg-[#f7ecd4] text-[#7a5a1f]",
  success: "bg-[#e5eee7] text-[#42654e]",
  complete: "bg-[#ebe9e5] text-[#4b4945]",
  danger: "bg-[#f8e7e4] text-[#9b4338]",
  muted: "bg-[#efeeeb] text-[#77736d]",
} as const;

export function TodayTimeline({ appointments, timezone }: { appointments: TodayAppointment[]; timezone: string }) {
  if (!appointments.length) return <div className="rounded-[12px] border border-dashed border-[var(--border-strong)] bg-white px-5 py-8 text-center"><p className="font-semibold">Nog geen afspraken vandaag</p><p className="mt-1 text-sm text-[var(--muted)]">Nieuwe afspraken verschijnen hier direct in de dagplanning.</p></div>;
  return <div className="overflow-hidden rounded-[12px] border border-[var(--border)] bg-white">
    {appointments.map((item,index)=>{
      const status=getStatusMeta(item.status);
      return <Link key={item.id} href={`/app/appointments/${item.id}`} className={`grid min-h-[76px] grid-cols-[56px_minmax(0,1fr)] items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--surface-soft)] sm:grid-cols-[68px_minmax(0,1fr)_auto] sm:px-5 ${index ? "border-t border-[var(--border)]" : ""}`}>
        <time className="text-sm font-semibold tabular-nums">{formatInTimeZone(new Date(item.starts_at),timezone,"HH:mm")}</time>
        <div className="min-w-0"><p className="truncate text-[15px] font-semibold">{item.customer?.name??item.customer_name_snapshot??"Klant"}</p><p className="mt-1 truncate text-sm text-[var(--muted)]">{item.service_name_snapshot}{item.staff?.name?` · ${item.staff.name}`:""}</p></div>
        <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${statusClass[status.tone]}`}>{status.label}</span>
      </Link>;
    })}
  </div>;
}
