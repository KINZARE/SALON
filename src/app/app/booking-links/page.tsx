import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getWorkspaceServices } from "@/services/workspace-data";
import { getStaff } from "@/services/app-data";
import { SmartBookingLinkCreator } from "@/components/workspace/smart-booking-link-creator";

export default async function BookingLinksPage(){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))return <div><h1 className="text-3xl font-semibold">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Booking links worden beheerd door owner of manager.</p></div>;
  const [services,staff]=await Promise.all([getWorkspaceServices(salon.id),getStaff(salon.id)]);
  const availableServices=services.filter(item=>item.active&&item.online_bookable);
  const today=formatInTimeZone(new Date(),salon.timezone,"yyyy-MM-dd");

  return <div data-smart-booking-links>
    <header><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Deel tijden</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Smart Booking Link</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">Kies de behandeling, eventueel een medewerker en een kort datumbereik. De klant ziet daarna alleen live beschikbare tijden en rondt de afspraak zelf af.</p></header>
    <div className="mt-7 max-w-2xl"><SmartBookingLinkCreator services={availableServices} staff={staff} today={today}/></div>
    <section className="mt-8 max-w-2xl rounded-[16px] border border-[var(--border)] bg-[var(--surface-soft)] p-4"><p className="text-sm font-semibold">Voor WhatsApp en telefoonaanvragen</p><p className="mt-1 text-xs leading-5 text-[var(--muted)]">Je hoeft niet meer handmatig vijf tijden heen en weer te sturen. De link gebruikt dezelfde server-authoritative availability als de gewone booking.</p></section>
  </div>;
}
