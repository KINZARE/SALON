import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getPublicStaffForService } from "@/services/public-booking";
import { RescheduleForm } from "@/components/appointments/reschedule-form";

export default async function ReschedulePage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const {salon,membership}=await requireAppContext();if(!["owner","manager"].includes(membership.role))return <p>Geen toegang.</p>;
  const db=createAdminSupabaseClient();
  const result=await db.from("appointments").select("id,service_id,staff_id,status,starts_at").eq("id",id).eq("salon_id",salon.id).maybeSingle();
  if(result.error)throw result.error;
  const data=result.data;
  if(!data||!data.service_id)notFound();if(["completed","cancelled","no_show"].includes(data.status))return <p>Deze afspraak kan niet meer worden verplaatst.</p>;
  const staff=await getPublicStaffForService(salon.id,data.service_id);
  return <><Link href={`/app/appointments/${id}`} className="text-sm text-[var(--muted)]">← Afspraak</Link><h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">Afspraak verplaatsen</h1><p className="mt-1 text-sm text-[var(--muted)]">De server controleert medewerker, openingstijd, rooster, pauzes, blocks en bezetting opnieuw.</p><RescheduleForm appointmentId={id} serviceId={data.service_id} staff={staff} initialStaffId={data.staff_id} initialStartsAt={data.starts_at} timezone={salon.timezone}/></>
}
