import Link from "next/link";
import { requireAppContext } from "@/lib/auth";
import { getCustomers, getServices } from "@/services/app-data";
import { getPublicStaffForService } from "@/services/public-booking";
import { NewAppointmentForm } from "@/components/appointments/new-appointment-form";
import { EmptyState } from "@/components/ui/empty-state";

export default async function NewAppointmentPage() {
  const { salon, membership } = await requireAppContext();

  if (!["owner", "manager"].includes(membership.role)) {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.045em]">Geen toegang</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Alleen owner en manager kunnen afspraken toevoegen.</p>
      </div>
    );
  }

  const [allServices, customers] = await Promise.all([getServices(salon.id), getCustomers(salon.id)]);
  const services = allServices.filter((service) => service.active);
  const pairs = await Promise.all(
    services.map(async (service) => [service.id, await getPublicStaffForService(salon.id, service.id)] as const),
  );

  return (
    <>
      <Link href="/app/calendar" className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]">
        ← Calendar
      </Link>
      <header className="mt-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Nieuwe afspraak</p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.055em]">Plan een afspraak</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Kies alleen wat nodig is. Duur en prijs komen automatisch uit de behandeling.</p>
      </header>

      {services.length ? (
        <NewAppointmentForm
          services={services}
          staffByService={Object.fromEntries(pairs)}
          customers={customers}
          timezone={salon.timezone}
        />
      ) : (
        <div className="mt-8 max-w-xl">
          <EmptyState title="Nog geen actieve behandelingen" description="Maak eerst een actieve behandeling aan voordat je een afspraak plant." />
        </div>
      )}
    </>
  );
}
