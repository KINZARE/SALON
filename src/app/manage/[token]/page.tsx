import { notFound } from "next/navigation";
import { formatInTimeZone } from "date-fns-tz";
import { formatMoney } from "@/lib/format";
import { StatusChip } from "@/components/ui/status-chip";
import { CustomerSelfServiceManager } from "@/components/booking/customer-self-service-manager";
import { getCustomerSelfServiceContext } from "@/services/customer-self-service";

export const dynamic="force-dynamic";

export default async function ManageAppointmentPage({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  const context=await getCustomerSelfServiceContext(token);
  if(!context)notFound();
  const {salon,appointment}=context;
  const date=formatInTimeZone(new Date(appointment.starts_at),salon.timezone,"EEEE d MMMM yyyy");
  const time=`${formatInTimeZone(new Date(appointment.starts_at),salon.timezone,"HH:mm")}–${formatInTimeZone(new Date(appointment.service_ends_at),salon.timezone,"HH:mm")}`;
  const cutoffLabel=formatInTimeZone(new Date(context.cutoffAt),salon.timezone,"d MMMM 'om' HH:mm");
  const initialDate=formatInTimeZone(new Date(appointment.starts_at),salon.timezone,"yyyy-MM-dd");

  return <main className="min-h-screen bg-[var(--background)] px-4 py-8 sm:py-12">
    <div className="mx-auto max-w-2xl">
      <header className="mb-7"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--accent)]">SALON</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Je afspraak</h1><p className="mt-1 text-sm text-[var(--muted)]">{salon.name}</p></header>
      <section className="overflow-hidden rounded-[28px] bg-[var(--ink)] p-5 text-white sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs capitalize text-white/55">{date}</p><p className="mt-2 text-4xl font-semibold tracking-[-.05em] tabular-nums">{time}</p></div><StatusChip status={appointment.status}/></div>
        <div className="mt-8"><p className="text-xl font-semibold">{appointment.customer_name_snapshot}</p><p className="mt-1 text-sm text-white/55">{appointment.service_name_snapshot} · {appointment.duration_minutes_snapshot} min</p><p className="mt-3 text-sm font-semibold">{formatMoney(appointment.price_cents_snapshot,appointment.currency_snapshot)}</p></div>
      </section>
      <CustomerSelfServiceManager token={token} staff={context.staff} initialStaffId={appointment.staff_id} initialDate={initialDate} canChange={context.canChange} cutoffLabel={cutoffLabel}/>
      <p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">Deze persoonlijke link geeft alleen toegang tot deze afspraak. Deel hem niet openbaar.</p>
    </div>
  </main>;
}
