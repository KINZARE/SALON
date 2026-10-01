"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { isPreviewDemoMode } from "@/lib/preview-mode";

function eurosToCents(value: string) {
  const amount = Number(value.trim().replace(",", "."));
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
}

export async function createService(formData: FormData) {
  const { salon, membership } = await requireAppContext();
  if (membership.role !== "owner") throw new Error("FORBIDDEN");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const duration = Number(formData.get("duration") ?? 0);
  const buffer = Number(formData.get("buffer") ?? 0);
  const priceCents = eurosToCents(String(formData.get("price") ?? ""));
  const onlineBookable = formData.get("onlineBookable") === "on";

  if (!name || name.length > 120 || !Number.isInteger(duration) || duration < 5 || duration > 720 || !Number.isInteger(buffer) || buffer < 0 || buffer > 180 || priceCents === null) {
    throw new Error("INVALID_SERVICE");
  }
  if (isPreviewDemoMode()) { revalidatePath("/app/services"); return; }

  const db = await createUserSupabaseClient();
  const { error } = await db.from("services").insert({
    salon_id: salon.id,
    name,
    description: description || null,
    duration_minutes: duration,
    buffer_minutes: buffer,
    price_cents: priceCents,
    currency: salon.currency,
    active: true,
    online_bookable: onlineBookable,
    payment_mode: "pay_in_salon",
  });
  if (error) throw error;
  revalidatePath("/app/services");
}

export async function toggleService(formData: FormData) {
  const { salon, membership } = await requireAppContext();
  if (membership.role !== "owner") throw new Error("FORBIDDEN");
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";
  if (isPreviewDemoMode()) { revalidatePath("/app/services"); return; }
  const db = await createUserSupabaseClient();
  const { error } = await db.from("services").update({ active: !active }).eq("id", id).eq("salon_id", salon.id);
  if (error) throw error;
  revalidatePath("/app/services");
}
