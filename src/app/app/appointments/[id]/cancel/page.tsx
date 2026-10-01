import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { transitionAppointmentStatus } from "../actions";

export default async function CancelAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { membership } = await requireAppContext();

  if (!["owner", "manager"].includes(membership.role)) notFound();

  return (
    <div className="mx-auto max-w-xl py-6 sm:py-10">
      <Link href={`/app/appointments/${id}`} className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]">
        ← Terug naar afspraak
      </Link>

      <div className="mt-6 rounded-[var(--radius-card)] border border-[#e7c3bd] bg-[#fff7f5] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--danger)]">Bevestigen</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Afspraak annuleren?</h1>
        <p className="mt-3 text-sm leading-6 text-[#76514c]">
          De afspraak krijgt de status geannuleerd. Controleer eerst of dit echt de bedoeling is.
        </p>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/app/appointments/${id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] border border-[var(--line)] bg-white px-5 text-sm font-medium"
          >
            Niet annuleren
          </Link>
          <form action={transitionAppointmentStatus}>
            <input type="hidden" name="appointmentId" value={id} />
            <input type="hidden" name="status" value="cancelled" />
            <button
              type="submit"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-pill)] bg-[var(--danger)] px-5 text-sm font-medium text-white sm:w-auto"
            >
              Ja, afspraak annuleren
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
