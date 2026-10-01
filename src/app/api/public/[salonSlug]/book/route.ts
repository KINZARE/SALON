import { NextResponse } from "next/server";
import { createPublicBooking } from "@/services/public-booking";
import { isUuid, normalizeOptionalText } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ salonSlug: string }> },
) {
  const { salonSlug } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const serviceId = typeof input.serviceId === "string" ? input.serviceId : null;
  const staffId = typeof input.staffId === "string" ? input.staffId : null;
  const startsAt = typeof input.startsAt === "string" ? input.startsAt : "";
  const customer = input.customer && typeof input.customer === "object" ? input.customer as Record<string, unknown> : {};
  const name = normalizeOptionalText(customer.name, 160);
  const phone = normalizeOptionalText(customer.phone, 40);
  const email = normalizeOptionalText(customer.email, 254);
  const note = normalizeOptionalText(customer.note, 1000);

  const phoneDigits = phone?.replace(/\D/g, "") ?? "";
  if (!isUuid(serviceId) || (staffId && !isUuid(staffId)) || !name || !phone || phoneDigits.length < 6 || !email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Controleer je naam, telefoonnummer en e-mailadres." }, { status: 400 });
  }

  try {
    const result = await createPublicBooking({
      salonSlug,
      serviceId,
      staffId,
      startsAt,
      customer: { name, phone, email, note },
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "SLOT_JUST_BOOKED" || code === "SLOT_UNAVAILABLE") {
      return NextResponse.json(
        { error: "Dit tijdstip is net geboekt of niet meer beschikbaar. Kies een ander tijdstip." },
        { status: 409 },
      );
    }
    console.error("public_booking_failed", { salonSlug, error });
    return NextResponse.json({ error: "Boeken is niet gelukt. Probeer het opnieuw." }, { status: 500 });
  }
}
