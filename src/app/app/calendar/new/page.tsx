import Link from "next/link";
import { requireAppContext } from "@/lib/auth";
import { getServices } from "@/services/app-data";
import { getPublicStaffForService } from "@/services/public-booking";
import { NewAppointmentForm } from "@/components/appointments/new-appointment-form";

export default async function NewAppointmentPage(){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))return <p>Geen toegang.</p>;
  const allServices=await getServices(salon.id);
  const services=allServices.filter(service=>service.active);
  const pairs=await Promise.all(services.map(async service=>[service.id,await getPublicStaffForService(salon.id,service.id)] as const));
  return <><Link href="/app/calendar" className="text-sm text-[var(--muted)]">← Calendar</Link><h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">Nieuwe afspraak</h1><p className="mt-1 text-sm text-[var(--muted)]">Zoek klanten server-side; duur, prijs en beschikbaarheid blijven authoritative.</p>{services.length?<NewAppointmentForm services={services} staffByService={Object.fromEntries(pairs)} timezone={salon.timezone}/>:<p className="mt-7 text-sm text-[var(--muted)]">Maak eerst een actieve behandeling aan.</p>}</>
}
