import { NextResponse } from "next/server";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { getAvailableSlotsForDate } from "@/services/public-booking";
import { isIsoDate, isUuid } from "@/lib/validation";
import { isPreviewDemoMode } from "@/lib/preview-mode";
import { PREVIEW_DEMO } from "@/demo/preview-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId");
  const staffId = url.searchParams.get("staffId");
  const date = url.searchParams.get("date");
  if (!isUuid(serviceId) || !isUuid(staffId) || !isIsoDate(date)) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  if (isPreviewDemoMode()) {
    const result = await getAvailableSlotsForDate({ salonSlug: PREVIEW_DEMO.salon.slug, serviceId, staffId, date, source: "internal" });
    return NextResponse.json({ slots: result.slots }, { headers: { "Cache-Control": "no-store" } });
  }

  const db = await createUserSupabaseClient();
  const userResult = await db.auth.getUser();
  if (!userResult.data.user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  const membership = await db.from("memberships").select("salon_id,role").eq("user_id", userResult.data.user.id).limit(1).maybeSingle();
  if (!membership.data || !["owner","manager"].includes(membership.data.role)) return NextResponse.json({ error: "Geen toegang." }, { status: 403 });
  const salon = await db.from("salons").select("slug").eq("id", membership.data.salon_id).single();
  if (!salon.data) return NextResponse.json({ error: "Salon niet gevonden." }, { status: 404 });

  try {
    const result = await getAvailableSlotsForDate({ salonSlug: salon.data.slug, serviceId, staffId, date, source: "internal" });
    return NextResponse.json({ slots: result.slots }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("internal_availability_failed", { error });
    return NextResponse.json({ error: "Beschikbaarheid kon niet worden geladen." }, { status: 500 });
  }
}
