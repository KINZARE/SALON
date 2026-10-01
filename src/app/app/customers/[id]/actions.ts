"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { isPreviewDemoMode } from "@/lib/preview-mode";

export async function updateCustomerNotes(formData: FormData) {
  const { salon, membership } = await requireAppContext();
  if (!['owner','manager'].includes(membership.role)) throw new Error("FORBIDDEN");
  const customerId = String(formData.get("customerId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!customerId || notes.length > 3000) throw new Error("INVALID_CUSTOMER_NOTES");
  if (isPreviewDemoMode()) { revalidatePath(`/app/customers/${customerId}`); return; }
  const db = await createUserSupabaseClient();
  const { error } = await db.from("customers").update({ internal_notes: notes || null }).eq("id", customerId).eq("salon_id", salon.id);
  if (error) throw error;
  revalidatePath(`/app/customers/${customerId}`);
}
