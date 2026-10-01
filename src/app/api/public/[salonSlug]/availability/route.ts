import { NextResponse } from "next/server";
import { getAvailableSlotsForDate } from "@/services/public-booking";
import { isIsoDate, isUuid } from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ salonSlug: string }> },
) {
  const { salonSlug } = await params;
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId");
  const date = url.searchParams.get("date");
  const staffId = url.searchParams.get("staffId");

  if (!isUuid(serviceId) || !isIsoDate(date) || (staffId && !isUuid(staffId))) {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  try {
    const result = await getAvailableSlotsForDate({ salonSlug, serviceId, date, staffId });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("availability_failed", { salonSlug, error });
    return NextResponse.json({ error: "Beschikbaarheid kon niet worden geladen." }, { status: 500 });
  }
}
