import { notFound } from "next/navigation";
import { SmartBookingFlow } from "@/components/booking/smart-booking-flow";
import { getSmartBookingLinkContext } from "@/services/smart-booking-links";

export const dynamic="force-dynamic";

export default async function SmartBookingPage({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  const context=await getSmartBookingLinkContext(token);
  if(!context)notFound();
  return <main className="min-h-screen bg-[var(--background)] px-4 py-8 sm:py-12">
    <div className="mx-auto max-w-xl">
      <header className="mb-7"><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--accent)]">SALON</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Kies wat voor jou werkt</h1><p className="mt-1 text-sm text-[var(--muted)]">{context.salon.name}</p></header>
      <SmartBookingFlow token={token} salon={{name:context.salon.name,timezone:context.salon.timezone}} service={context.service} staff={context.staff} lockedStaffId={context.link.staff_id} startDate={context.link.starts_on} endDate={context.link.ends_on}/>
      <p className="mt-6 text-center text-xs leading-5 text-[var(--muted)]">Alle getoonde tijden worden live gecontroleerd. Een tijd is pas definitief na bevestiging.</p>
    </div>
  </main>;
}
