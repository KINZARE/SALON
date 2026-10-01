"use server";

import { revalidatePath } from "next/cache";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { isPreviewDemoMode } from "@/lib/preview-mode";

export async function createBlock(formData: FormData) {
  const { salon, user, membership } = await requireAppContext();
  if (!['owner','manager'].includes(membership.role)) throw new Error("FORBIDDEN");
  const staffId = String(formData.get("staffId") ?? "").trim();
  const startLocal = String(formData.get("startsAt") ?? "");
  const endLocal = String(formData.get("endsAt") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!startLocal || !endLocal) throw new Error("INVALID_BLOCK");
  const startsAt = fromZonedTime(startLocal, salon.timezone);
  const endsAt = fromZonedTime(endLocal, salon.timezone);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || startsAt >= endsAt) throw new Error("INVALID_BLOCK");
  if (formatInTimeZone(startsAt, salon.timezone, "yyyy-MM-dd'T'HH:mm") !== startLocal || formatInTimeZone(endsAt, salon.timezone, "yyyy-MM-dd'T'HH:mm") !== endLocal) {
    throw new Error("INVALID_LOCAL_TIME");
  }
  if (isPreviewDemoMode()) { revalidatePath("/app/blocks"); return; }

  const db = await createUserSupabaseClient();
  const { error } = await db.from("blocks").insert({
    salon_id: salon.id,
    staff_id: staffId || null,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    reason: reason || null,
    created_by: user.id,
  });
  if (error) throw error;
  revalidatePath("/app/blocks");
  revalidatePath("/app/calendar");
}

export async function deleteBlock(formData: FormData) {
  const { salon, membership } = await requireAppContext();
  if (!['owner','manager'].includes(membership.role)) throw new Error("FORBIDDEN");
  const id = String(formData.get("id") ?? "");
  if (isPreviewDemoMode()) { revalidatePath("/app/blocks"); return; }
  const db = await createUserSupabaseClient();
  const { error } = await db.from("blocks").delete().eq("id", id).eq("salon_id", salon.id);
  if (error) throw error;
  revalidatePath("/app/blocks");
  revalidatePath("/app/calendar");
}
