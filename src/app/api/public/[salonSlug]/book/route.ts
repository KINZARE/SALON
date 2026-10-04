import { NextResponse } from "next/server";
import { createPublicBooking } from "@/services/public-booking";
import { PublicBookingSchema } from "@/lib/schemas";

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

  const parsed = PublicBookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Controleer je naam, telefoonnummer, e-mailadres en gekozen tijdstip." }, { status: 400 });
  const { serviceId, staffId, startsAt, customer } = parsed.data;

  try {
    const result = await createPublicBooking({
      salonSlug,
      serviceId,
      staffId,
      startsAt,
      customer,
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
