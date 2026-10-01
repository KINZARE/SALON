import { NextResponse } from "next/server";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation";
import { isPreviewDemoMode } from "@/lib/preview-mode";

export async function POST(request: Request) {
  if (isPreviewDemoMode()) {
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
    const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : null;
    const staffId = typeof body.staffId === "string" ? body.staffId : null;
    const startsAt = typeof body.startsAt === "string" ? body.startsAt : "";
    if (!isUuid(appointmentId) || !isUuid(staffId) || Number.isNaN(Date.parse(startsAt))) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
    return NextResponse.json({ ok: true, preview: true });
  }
  const db = await createUserSupabaseClient();
  const user = (await db.auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
  const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : null;
  const staffId = typeof body.staffId === "string" ? body.staffId : null;
  const startsAt = typeof body.startsAt === "string" ? body.startsAt : "";
  if (!isUuid(appointmentId) || !isUuid(staffId) || Number.isNaN(Date.parse(startsAt))) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  const { error } = await db.rpc("reschedule_appointment_atomic", { p_appointment_id: appointmentId, p_staff_id: staffId, p_starts_at: startsAt });
  if (error) {
    if (error.code === "23P01" || error.message.includes("SLOT_JUST_BOOKED")) return NextResponse.json({ error: "Dit tijdstip is net geboekt. Kies een ander tijdstip." }, { status: 409 });
    console.error("reschedule_failed", { appointmentId, code: error.code, message: error.message });
    return NextResponse.json({ error: "Verplaatsen is niet gelukt." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
