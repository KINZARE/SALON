"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { appointmentStatuses,type AppointmentStatus } from "@/domain/appointment-status";
import { requireAppContext } from "@/lib/auth";
import { saveWorkspaceEntity } from "@/services/workspace-mutations";

export async function transitionAppointmentStatus(formData:FormData){
  const appointmentId=String(formData.get("appointmentId")??"");
  const status=String(formData.get("status")??"") as AppointmentStatus;
  if(!appointmentStatuses.includes(status))redirect(`/app/appointments/${appointmentId}?error=Ongeldige+status.`);
  await requireAppContext();
  const db=await createUserSupabaseClient();
  const {error}=await db.rpc("transition_appointment_status",{p_appointment_id:appointmentId,p_to_status:status});
  if(error){console.error("appointment_status_failed",{appointmentId,code:error.code,message:error.message});redirect(`/app/appointments/${appointmentId}?error=Status+kon+niet+worden+gewijzigd.`)}
  revalidatePath("/app/today");revalidatePath("/app/calendar");revalidatePath(`/app/appointments/${appointmentId}`);
}

export async function updateAppointmentNote(formData:FormData){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");
  const appointmentId=String(formData.get("appointmentId")??"");
  const note=String(formData.get("note")??"").trim();
  if(!appointmentId||note.length>1000)redirect(`/app/appointments/${appointmentId}?error=Notitie+is+ongeldig.`);
  try{await saveWorkspaceEntity(salon.id,"note",{id:appointmentId,note})}catch{redirect(`/app/appointments/${appointmentId}?error=Notitie+kon+niet+worden+opgeslagen.`)}
  revalidatePath(`/app/appointments/${appointmentId}`);
  redirect(`/app/appointments/${appointmentId}?saved=1`);
}
