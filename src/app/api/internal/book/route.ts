import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createInternalBooking } from "@/services/internal-booking";
import { isUuid, normalizeOptionalText } from "@/lib/validation";

export async function POST(request: Request) {
  const db = createAdminSupabaseClient();
  const salonResult = await db.from("salons").select("id,slug,timezone").eq("slug","salon").single();
  if (!salonResult.data) return NextResponse.json({ error: "Salon niet gevonden." }, { status: 404 });

  let input: Record<string, unknown>;
  try { input = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
  const serviceId = typeof input.serviceId === "string" ? input.serviceId : null;
  const staffId = typeof input.staffId === "string" ? input.staffId : null;
  const startsAt = typeof input.startsAt === "string" ? input.startsAt : "";
  const customer = input.customer && typeof input.customer === "object" ? input.customer as Record<string, unknown> : {};
  const customerId = typeof input.customerId === "string" && isUuid(input.customerId) ? input.customerId : null;
  const name = normalizeOptionalText(customer.name, 160);
  const phone = normalizeOptionalText(customer.phone, 40);
  const email = normalizeOptionalText(customer.email, 254);
  const note = normalizeOptionalText(customer.note, 1000);
  if (!isUuid(serviceId) || !isUuid(staffId) || !name || (email && !/^\S+@\S+\.\S+$/.test(email))) return NextResponse.json({ error: "Vul geldige klant-, behandeling-, medewerker- en tijdgegevens in." }, { status: 400 });

  try {
    const appointmentId = await createInternalBooking({ salon: salonResult.data, userId: null, serviceId, staffId, startsAt, customer: { id: customerId, name, phone, email, note } });
    return NextResponse.json({ appointmentId }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (["SLOT_UNAVAILABLE","SLOT_JUST_BOOKED"].includes(code)) return NextResponse.json({ error: "Dit tijdstip is niet meer beschikbaar. Kies een ander tijdstip." }, { status: 409 });
    console.error("internal_booking_failed", { error });
    return NextResponse.json({ error: "Afspraak kon niet worden opgeslagen." }, { status: 500 });
  }
}
