import Link from "next/link";
import { requireAppContext } from "@/lib/auth";
import { getCustomers, getServices } from "@/services/app-data";
import { getPublicStaffForService } from "@/services/public-booking";
import { NewAppointmentForm } from "@/components/appointments/new-appointment-form";

export default async function NewAppointmentPage(){const {salon,membership}=await requireAppContext();if(!["owner","manager"].includes(membership.role))return <p>Geen toegang.</p>;const [allServices, customers]=await Promise.all([getServices(salon.id),getCustomers(salon.id)]);const services=allServices.filter(s=>s.active);const pairs=await Promise.all(services.map(async s=>[s.id,await getPublicStaffForService(salon.id,s.id)] as const));return <><Link href="/app/calendar" className="text-sm text-[var(--muted)]">← Calendar</Link><h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">Nieuwe afspraak</h1><p className="mt-1 text-sm text-[var(--muted)]">Kies alleen wat nodig is; duur en prijs komen uit de behandeling.</p>{services.length?<NewAppointmentForm services={services} staffByService={Object.fromEntries(pairs)} customers={customers} timezone={salon.timezone}/>:<p className="mt-7 text-sm text-[var(--muted)]">Maak eerst een actieve behandeling aan.</p>}</>}
