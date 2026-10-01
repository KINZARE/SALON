import { NextResponse } from "next/server";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { createInternalBooking } from "@/services/internal-booking";
import { isUuid, normalizeOptionalText } from "@/lib/validation";
import { isPreviewDemoMode } from "@/lib/preview-mode";
import { PREVIEW_DEMO } from "@/demo/preview-data";

export async function POST(request: Request) {
  if (isPreviewDemoMode()) {
    let input: Record<string, unknown>;
    try { input = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
    const serviceId = typeof input.serviceId === "string" ? input.serviceId : null;
    const staffId = typeof input.staffId === "string" ? input.staffId : null;
    const startsAt = typeof input.startsAt === "string" ? input.startsAt : "";
    const customer = input.customer && typeof input.customer === "object" ? input.customer as Record<string, unknown> : {};
    const name = normalizeOptionalText(customer.name, 160);
    const phone = normalizeOptionalText(customer.phone, 40);
    const email = normalizeOptionalText(customer.email, 254);
    const note = normalizeOptionalText(customer.note, 1000);
    if (!isUuid(serviceId) || !isUuid(staffId) || !name || Number.isNaN(Date.parse(startsAt))) return NextResponse.json({ error: "Vul geldige gegevens in." }, { status: 400 });
    try {
      const appointmentId = await createInternalBooking({ salon: PREVIEW_DEMO.salon, userId: PREVIEW_DEMO.user.id, serviceId, staffId, startsAt, customer: { name, phone, email, note } });
      return NextResponse.json({ appointmentId }, { status: 201 });
    } catch (error) {
      const code = error instanceof Error ? error.message : "UNKNOWN";
      if (["SLOT_UNAVAILABLE","SLOT_JUST_BOOKED"].includes(code)) return NextResponse.json({ error: "Dit tijdstip is niet meer beschikbaar. Kies een ander tijdstip." }, { status: 409 });
      return NextResponse.json({ error: "Preview-afspraak kon niet worden verwerkt." }, { status: 500 });
    }
  }
  const db = await createUserSupabaseClient();
  const userResult = await db.auth.getUser();
  const user = userResult.data.user;
  if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  const membership = await db.from("memberships").select("salon_id,role").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership.data || !["owner","manager"].includes(membership.data.role)) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  const salonResult = await db.from("salons").select("id,slug,timezone").eq("id", membership.data.salon_id).single();
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
    const appointmentId = await createInternalBooking({ salon: salonResult.data, userId: user.id, serviceId, staffId, startsAt, customer: { id: customerId, name, phone, email, note } });
    return NextResponse.json({ appointmentId }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (["SLOT_UNAVAILABLE","SLOT_JUST_BOOKED"].includes(code)) return NextResponse.json({ error: "Dit tijdstip is niet meer beschikbaar. Kies een ander tijdstip." }, { status: 409 });
    console.error("internal_booking_failed", { error });
    return NextResponse.json({ error: "Afspraak kon niet worden opgeslagen." }, { status: 500 });
  }
}
