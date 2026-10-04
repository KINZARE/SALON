import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { RescheduleInputSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const db = createAdminSupabaseClient();
  const salon = await db.from("salons").select("id").eq("slug","salon").single();
  if (!salon.data) return NextResponse.json({ error: "Salon niet gevonden." }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
  const parsed=RescheduleInputSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Ongeldige aanvraag. Controleer de gegevens."},{status:400});
  const {appointmentId,staffId,startsAt}=parsed.data;
  const appointment = await db.from("appointments").select("salon_id").eq("id",appointmentId).maybeSingle();
  if (!appointment.data || appointment.data.salon_id !== salon.data.id) return NextResponse.json({ error: "Afspraak niet gevonden." }, { status: 404 });

  const { error } = await db.rpc("reschedule_appointment_atomic", { p_appointment_id: appointmentId, p_staff_id: staffId, p_starts_at: startsAt });
  if (error) {
    if (error.code === "23P01" || error.message.includes("SLOT_JUST_BOOKED")) return NextResponse.json({ error: "Dit tijdstip is net geboekt. Kies een ander tijdstip." }, { status: 409 });
    console.error("reschedule_failed", { appointmentId, code: error.code, message: error.message });
    return NextResponse.json({ error: "Verplaatsen is niet gelukt." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
