import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/validation";
import { parseUnambiguousLocalDateTime } from "@/domain/local-time";
import { moveWorkspaceAppointment } from "@/services/workspace-mutations";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
  const appointmentId = typeof body.appointmentId === "string" ? body.appointmentId : "";
  const staffId = typeof body.staffId === "string" ? body.staffId : "";
  const localStart = typeof body.localStart === "string" ? body.localStart : "";
  const expectedStartsAt = typeof body.expectedStartsAt === "string" ? body.expectedStartsAt : null;
  const expectedStaffId = typeof body.expectedStaffId === "string" ? body.expectedStaffId : null;
  if (!isUuid(appointmentId) || !isUuid(staffId)) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });

  const db = createAdminSupabaseClient();
  const salon = await db.from("salons").select("id,timezone").eq("slug","salon").single();
  if (!salon.data) return NextResponse.json({ error: "Salon niet gevonden." }, { status: 404 });

  const start = parseUnambiguousLocalDateTime(localStart, salon.data.timezone);
  if (!start) return NextResponse.json({ error: "Dit lokale tijdstip bestaat niet of is dubbelzinnig door de klokwisseling." }, { status: 409 });

  try {
    await moveWorkspaceAppointment({ appointmentId, staffId, startsAt: start.toISOString(), expectedStartsAt, expectedStaffId });
    return NextResponse.json({ ok: true, startsAt: start.toISOString(), staffId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";
    const conflict = ["STALE_APPOINTMENT","SLOT_UNAVAILABLE","SLOT_JUST_BOOKED"].some((code) => message.includes(code)) || message.includes("23P01");
    return NextResponse.json({ error: conflict ? "De planning is intussen gewijzigd of dit tijdstip is niet beschikbaar. De actuele planning is opnieuw geladen." : "Verplaatsen is niet gelukt." }, { status: conflict ? 409 : 400 });
  }
}
