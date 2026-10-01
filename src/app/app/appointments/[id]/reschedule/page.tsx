import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { getPublicStaffForService } from "@/services/public-booking";
import { RescheduleForm } from "@/components/appointments/reschedule-form";
import { isPreviewDemoMode } from "@/lib/preview-mode";
import { getDemoAppointment } from "@/demo/preview-data";

export default async function ReschedulePage({params}:{params:Promise<{id:string}>}) {
  const { id } = await params;
  const { salon, membership } = await requireAppContext();
  if (!["owner","manager"].includes(membership.role)) return <p>Geen toegang.</p>;
  let data;
  if (isPreviewDemoMode()) {
    data = getDemoAppointment(id);
  } else {
    const db = await createUserSupabaseClient();
    const result = await db.from("appointments").select("id,service_id,staff_id,status").eq("id",id).eq("salon_id",salon.id).maybeSingle();
    if (result.error) throw result.error;
    data = result.data;
  }
  if (!data || !data.service_id) notFound();
  if (["completed","cancelled","no_show"].includes(data.status)) return <p>Deze afspraak kan niet meer worden verplaatst.</p>;
  const staff = await getPublicStaffForService(salon.id, data.service_id);
  return <><Link href={`/app/appointments/${id}`} className="text-sm text-[var(--muted)]">← Afspraak</Link><h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">Afspraak verplaatsen</h1><p className="mt-1 text-sm text-[var(--muted)]">De bestaande afspraak blijft dezelfde; alleen medewerker en tijd wijzigen.</p><RescheduleForm appointmentId={id} serviceId={data.service_id} staff={staff} initialStaffId={data.staff_id} timezone={salon.timezone}/></>;
}
