import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getPublicSalon, getPublicServices, getPublicStaffForService } from "@/services/public-booking";

export const dynamic = "force-dynamic";

export default async function BookingPage({ params }: { params: Promise<{ salonSlug: string }> }) {
  const { salonSlug } = await params;
  const salon = await getPublicSalon(salonSlug);
  if (!salon) notFound();
  const services = await getPublicServices(salon.id);
  const staffEntries = salon.allowStaffChoice
    ? await Promise.all(services.map(async (service) => [service.id, await getPublicStaffForService(salon.id, service.id)] as const))
    : services.map((service) => [service.id, []] as const);
  const staffByService = Object.fromEntries(staffEntries);

  return (
    <main className="min-h-screen bg-white sm:bg-[var(--background)]">
      <div className="mx-auto min-h-screen max-w-2xl bg-white px-5 py-6 sm:my-8 sm:min-h-0 sm:rounded-[18px] sm:border sm:border-[var(--border)] sm:px-9 sm:py-8">
        <header className="mb-8 flex items-center justify-between border-b border-[var(--border)] pb-5">
          <div>
            <p className="text-lg font-semibold tracking-[-0.02em]">{salon.name}</p>
            <p className="mt-0.5 text-sm text-[var(--muted)]">Online afspraak maken</p>
          </div>
        </header>
        {services.length ? <BookingFlow salon={salon} services={services} staffByService={staffByService} /> : <p className="py-16 text-center text-sm text-[var(--muted)]">Er zijn nog geen behandelingen online boekbaar.</p>}
      </div>
    </main>
  );
}
