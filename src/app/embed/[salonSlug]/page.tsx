import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getPublicSalon,getPublicServices,getPublicStaffForService } from "@/services/public-booking";
import { getWidgetSettings } from "@/services/product-completion";

export const dynamic="force-dynamic";

export default async function BookingEmbedPage({params}:{params:Promise<{salonSlug:string}>}){
  const {salonSlug}=await params;
  const salon=await getPublicSalon(salonSlug);if(!salon)notFound();
  const [services,settings]=await Promise.all([getPublicServices(salon.id),getWidgetSettings(salon.id)]);
  const staffEntries=salon.allowStaffChoice
    ?await Promise.all(services.map(async service=>[service.id,await getPublicStaffForService(salon.id,service.id)] as const))
    :services.map(service=>[service.id,[]] as const);
  const style={"--primary":settings.accent_color,"--accent":settings.accent_color} as CSSProperties;

  return <main style={style} className="min-h-screen bg-white px-4 py-5">
    <header className="mx-auto mb-6 max-w-xl border-b border-[var(--border)] pb-4"><p className="text-base font-semibold">{salon.name}</p><p className="mt-0.5 text-xs text-[var(--muted)]">Online afspraak maken</p></header>
    {services.length?<BookingFlow salon={salon} services={services} staffByService={Object.fromEntries(staffEntries)}/>:<p className="py-10 text-center text-sm text-[var(--muted)]">Geen behandelingen online boekbaar.</p>}
  </main>;
}
