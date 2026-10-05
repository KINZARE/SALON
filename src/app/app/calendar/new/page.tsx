import Link from "next/link";
import { requireAppContext } from "@/lib/auth";
import { getServices } from "@/services/app-data";
import { getCustomerById } from "@/services/workspace-data";
import { getPublicStaffForService } from "@/services/public-booking";
import { NewAppointmentForm } from "@/components/appointments/new-appointment-form";

export default async function NewAppointmentPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))return <p>Geen toegang.</p>;
  const params=await searchParams;
  const requestedCustomerId=typeof params.customerId==="string"?params.customerId:"";
  const [allServices,initialCustomer]=await Promise.all([
    getServices(salon.id),
    requestedCustomerId?getCustomerById(salon.id,requestedCustomerId):Promise.resolve(null),
  ]);
  const services=allServices.filter(service=>service.active);
  const pairs=await Promise.all(services.map(async service=>[service.id,await getPublicStaffForService(salon.id,service.id)] as const));

  return <>
    <Link href="/app/calendar" className="text-sm text-[var(--muted)] hover:text-[var(--ink)]">← Agenda</Link>
    <header className="mt-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Nieuwe afspraak</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em]">Nieuwe afspraak</h1><p className="mt-1 text-sm text-[var(--muted)]">{initialCustomer?`Klant ${initialCustomer.name} staat alvast geselecteerd.`:"Kies een klant, behandeling en beschikbare tijd."}</p></header>
    {services.length?<NewAppointmentForm services={services} staffByService={Object.fromEntries(pairs)} timezone={salon.timezone} initialCustomer={initialCustomer}/>:<p className="mt-7 text-sm text-[var(--muted)]">Maak eerst een actieve behandeling aan.</p>}
  </>;
}
