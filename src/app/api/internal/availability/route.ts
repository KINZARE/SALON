import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAvailableSlotsForDate } from "@/services/public-booking";
import { isIsoDate, isUuid } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId");
  const staffId = url.searchParams.get("staffId");
  const date = url.searchParams.get("date");
  if (!isUuid(serviceId) || !isUuid(staffId) || !isIsoDate(date)) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });

  const db = createAdminSupabaseClient();
  const salon = await db.from("salons").select("id,slug").eq("slug","salon").single();
  if (!salon.data) return NextResponse.json({ error: "Salon niet gevonden." }, { status: 404 });

  try {
    const result = await getAvailableSlotsForDate({ salonSlug: salon.data.slug, serviceId, staffId, date, source: "internal" });
    return NextResponse.json({ slots: result.slots }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("internal_availability_failed", { error });
    return NextResponse.json({ error: "Beschikbaarheid kon niet worden geladen." }, { status: 500 });
  }
}
