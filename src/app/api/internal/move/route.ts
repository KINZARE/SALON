import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { CalendarMoveSchema } from "@/lib/schemas";
import { parseUnambiguousLocalDateTime } from "@/domain/local-time";
import { moveWorkspaceAppointment } from "@/services/workspace-mutations";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
  const parsed = CalendarMoveSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  const { appointmentId, staffId, localStart, expectedStartsAt, expectedStaffId } = parsed.data;

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
