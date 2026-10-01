"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { isPreviewDemoMode } from "@/lib/preview-mode";

function assertOwner(role: string) {
  if (role !== "owner") throw new Error("FORBIDDEN");
}

export async function updateSalonProfile(formData: FormData) {
  const { salon, membership } = await requireAppContext();
  assertOwner(membership.role);
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name || name.length > 120 || email.length > 254 || phone.length > 60 || address.length > 300) throw new Error("INVALID_SALON");
  if (isPreviewDemoMode()) { revalidatePath("/app/settings"); return; }
  const db = await createUserSupabaseClient();
  const { error } = await db.from("salons").update({ name, phone: phone || null, email: email || null, address: address || null }).eq("id", salon.id);
  if (error) throw error;
  revalidatePath("/app/settings");
  revalidatePath("/app");
}

export async function updateBookingSettings(formData: FormData) {
  const { salon, membership } = await requireAppContext();
  assertOwner(membership.role);
  const slotInterval = Number(formData.get("slotInterval") ?? 15);
  const minLead = Number(formData.get("minLead") ?? 60);
  const maxDays = Number(formData.get("maxDays") ?? 90);
  const cancellationHours = Number(formData.get("cancellationHours") ?? 24);
  const allowStaffChoice = formData.get("allowStaffChoice") === "on";
  if (![5,10,15,20,30,60].includes(slotInterval) || !Number.isInteger(minLead) || minLead < 0 || !Number.isInteger(maxDays) || maxDays < 1 || maxDays > 365 || !Number.isInteger(cancellationHours) || cancellationHours < 0) throw new Error("INVALID_BOOKING_SETTINGS");
  if (isPreviewDemoMode()) { revalidatePath("/app/settings"); return; }
  const db = await createUserSupabaseClient();
  const { error } = await db.from("booking_settings").update({
    slot_interval_minutes: slotInterval,
    min_lead_minutes: minLead,
    max_days_ahead: maxDays,
    allow_staff_choice: allowStaffChoice,
    cancellation_hours: cancellationHours,
  }).eq("salon_id", salon.id);
  if (error) throw error;
  revalidatePath("/app/settings");
  revalidatePath(`/book/${salon.slug}`);
}

export async function updateOpeningHours(formData: FormData) {
  const { salon, membership } = await requireAppContext();
  assertOwner(membership.role);
  const rows = Array.from({ length: 7 }, (_, weekday) => {
    const isOpen = formData.get(`open-${weekday}`) === "on";
    const start = String(formData.get(`start-${weekday}`) ?? "09:00");
    const end = String(formData.get(`end-${weekday}`) ?? "18:00");
    if (isOpen && (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || start >= end)) throw new Error("INVALID_OPENING_HOURS");
    return { salon_id: salon.id, weekday, is_open: isOpen, start_time: isOpen ? start : null, end_time: isOpen ? end : null };
  });
  if (isPreviewDemoMode()) { revalidatePath("/app/settings"); return; }
  const db = await createUserSupabaseClient();
  const { error } = await db.from("opening_hours").upsert(rows, { onConflict: "salon_id,weekday" });
  if (error) throw error;
  revalidatePath("/app/settings");
  revalidatePath("/app/calendar");
  revalidatePath(`/book/${salon.slug}`);
}
