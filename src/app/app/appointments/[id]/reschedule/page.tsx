import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { getPublicStaffForService } from "@/services/public-booking";
import { RescheduleForm } from "@/components/appointments/reschedule-form";
import { isPreviewDemoMode } from "@/lib/preview-mode";
import { getDemoAppointment } from "@/demo/preview-data";

export default async function ReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { salon, membership } = await requireAppContext();

  if (!["owner", "manager"].includes(membership.role)) {
    return <p className="text-sm text-[var(--muted)]">Geen toegang.</p>;
  }

  let data;

  if (isPreviewDemoMode()) {
    data = getDemoAppointment(id);
  } else {
    const db = await createUserSupabaseClient();
    const result = await db
      .from("appointments")
      .select("id,service_id,staff_id,status")
      .eq("id", id)
      .eq("salon_id", salon.id)
      .maybeSingle();

    if (result.error) throw result.error;
    data = result.data;
  }

  if (!data || !data.service_id) notFound();

  if (["completed", "cancelled", "no_show"].includes(data.status)) {
    return (
      <div className="max-w-xl">
        <h1 className="text-3xl font-semibold tracking-[-0.045em]">Niet meer te verplaatsen</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Deze afspraak is al afgerond, geannuleerd of als no-show gemarkeerd.</p>
        <Link href={`/app/appointments/${id}`} className="mt-5 inline-flex min-h-11 items-center rounded-[var(--radius-pill)] border border-[var(--line)] px-5 text-sm font-medium">
          Terug naar afspraak
        </Link>
      </div>
    );
  }

  const staff = await getPublicStaffForService(salon.id, data.service_id);

  return (
    <>
      <Link href={`/app/appointments/${id}`} className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]">
        ← Afspraak
      </Link>
      <header className="mt-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Verplaatsen</p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.055em]">Nieuwe tijd kiezen</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">De bestaande afspraak blijft dezelfde; alleen medewerker en tijd worden gewijzigd.</p>
      </header>
      <RescheduleForm
        appointmentId={id}
        serviceId={data.service_id}
        staff={staff}
        initialStaffId={data.staff_id}
        timezone={salon.timezone}
      />
    </>
  );
}
