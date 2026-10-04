import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createInternalBooking } from "@/services/internal-booking";
import { AppointmentInputSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const db = createAdminSupabaseClient();
  const salonResult = await db.from("salons").select("id,slug,timezone").eq("slug","salon").single();
  if (!salonResult.data) return NextResponse.json({ error: "Salon niet gevonden." }, { status: 404 });

  let input: Record<string, unknown>;
  try { input = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
  const parsed = AppointmentInputSchema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "Vul geldige klant-, behandeling-, medewerker- en tijdgegevens in." }, { status: 400 });
  const { serviceId, staffId, startsAt, customerId, customer } = parsed.data;

  try {
    const appointmentId = await createInternalBooking({ salon: salonResult.data, userId: null, serviceId, staffId, startsAt, customer: { ...customer, id: customerId } });
    return NextResponse.json({ appointmentId }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (["SLOT_UNAVAILABLE","SLOT_JUST_BOOKED"].includes(code)) return NextResponse.json({ error: "Dit tijdstip is niet meer beschikbaar. Kies een ander tijdstip." }, { status: 409 });
    console.error("internal_booking_failed", { error });
    return NextResponse.json({ error: "Afspraak kon niet worden opgeslagen." }, { status: 500 });
  }
}
