import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking/booking-flow";
import { getPublicSalon, getPublicServices, getPublicStaffForService } from "@/services/public-booking";
import { isPreviewDemoMode } from "@/lib/preview-mode";

export const dynamic = "force-dynamic";

export default async function BookingPage({ params }: { params: Promise<{ salonSlug: string }> }) {
  const { salonSlug } = await params;
  const salon = await getPublicSalon(salonSlug);
  if (!salon) notFound();

  const services = await getPublicServices(salon.id);
  const staffEntries = salon.allowStaffChoice
    ? await Promise.all(
        services.map(async (service) => [service.id, await getPublicStaffForService(salon.id, service.id)] as const),
      )
    : services.map((service) => [service.id, []] as const);
  const staffByService = Object.fromEntries(staffEntries);
  const preview = isPreviewDemoMode();

  return (
    <main className="min-h-screen bg-[var(--surface)] px-0 py-0 sm:px-5 sm:py-8">
      <div className="mx-auto min-h-screen max-w-2xl bg-white px-5 py-6 sm:min-h-0 sm:rounded-[var(--radius-card)] sm:border sm:border-[var(--line)] sm:px-9 sm:py-8 sm:shadow-[var(--shadow-soft)]">
        {preview ? (
          <div role="status" className="mb-5 rounded-[var(--radius-control)] border border-[#ead5c5] bg-[var(--accent-soft)] px-4 py-3 text-sm leading-6 text-[#74411f]">
            <strong className="font-semibold">Preview mode</strong>
            <span className="text-[#8b5a39]"> · Deze boeking is een demo en wordt niet opgeslagen.</span>
          </div>
        ) : null}

        <header className="mb-9 flex items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">SALON</p>
            <p className="mt-1 truncate text-lg font-semibold tracking-[-0.03em]">{salon.name}</p>
          </div>
          <span className="shrink-0 rounded-[var(--radius-pill)] bg-[var(--surface)] px-3 py-2 text-[11px] font-medium text-[var(--muted)]">
            Online boeken
          </span>
        </header>

        {services.length ? (
          <BookingFlow salon={salon} services={services} staffByService={staffByService} />
        ) : (
          <div className="rounded-[var(--radius-card-sm)] bg-[var(--surface)] px-5 py-14 text-center">
            <p className="font-semibold">Nog niet online boekbaar</p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
              Deze salon heeft op dit moment geen behandelingen beschikbaar voor online booking.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
