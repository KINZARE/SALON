"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { appointmentStatuses, type AppointmentStatus } from "@/domain/appointment-status";
import { isPreviewDemoMode } from "@/lib/preview-mode";

export async function transitionAppointmentStatus(formData: FormData) {
  const appointmentId = String(formData.get("appointmentId") ?? "");
  const status = String(formData.get("status") ?? "") as AppointmentStatus;
  if (!appointmentStatuses.includes(status)) redirect(`/app/appointments/${appointmentId}?error=Ongeldige+status.`);
  if (isPreviewDemoMode()) {
    revalidatePath(`/app/appointments/${appointmentId}`);
    return;
  }
  const db = await createUserSupabaseClient();
  const { error } = await db.rpc("transition_appointment_status", {
    p_appointment_id: appointmentId,
    p_to_status: status,
  });
  if (error) {
    console.error("appointment_status_failed", { appointmentId, code: error.code, message: error.message });
    redirect(`/app/appointments/${appointmentId}?error=Status+kon+niet+worden+gewijzigd.`);
  }
  revalidatePath("/app/today");
  revalidatePath("/app/calendar");
  revalidatePath(`/app/appointments/${appointmentId}`);
}
