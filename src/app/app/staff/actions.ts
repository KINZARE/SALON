"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { isPreviewDemoMode } from "@/lib/preview-mode";

export async function createStaff(formData: FormData) {
  const { salon, membership } = await requireAppContext();
  if (membership.role !== "owner") throw new Error("FORBIDDEN");

  const name = String(formData.get("name") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "09:00");
  const endTime = String(formData.get("endTime") ?? "18:00");
  const serviceIds = formData.getAll("serviceIds").map(String).filter(Boolean);
  const weekdays = formData.getAll("weekdays").map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
  if (!name || name.length > 120 || serviceIds.length === 0 || weekdays.length === 0 || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || startTime >= endTime) {
    throw new Error("INVALID_STAFF");
  }
  if (isPreviewDemoMode()) { revalidatePath("/app/staff"); return; }

  const db = await createUserSupabaseClient();
  const { error } = await db.rpc("create_staff_with_schedule", {
    p_salon_id: salon.id,
    p_name: name,
    p_service_ids: serviceIds,
    p_weekdays: weekdays,
    p_start_time: startTime,
    p_end_time: endTime,
  });
  if (error) throw error;
  revalidatePath("/app/staff");
}

export async function toggleStaff(formData: FormData) {
  const { salon, membership } = await requireAppContext();
  if (membership.role !== "owner") throw new Error("FORBIDDEN");
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (isPreviewDemoMode()) { revalidatePath("/app/staff"); return; }
  const db = await createUserSupabaseClient();
  const { error } = await db.from("staff").update({ active: !active }).eq("id", id).eq("salon_id", salon.id);
  if (error) throw error;
  revalidatePath("/app/staff");
}
