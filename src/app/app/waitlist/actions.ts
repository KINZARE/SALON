"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth";
import { updateWaitlistEntryStatus } from "@/services/waitlist";
import { isUuid } from "@/lib/validation";

export async function updateWaitlistStatus(formData:FormData){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");
  const id=String(formData.get("id")??"");
  const status=String(formData.get("status")??"");
  if(!isUuid(id)||!["waiting","contacted","booked","cancelled"].includes(status))throw new Error("INVALID_INPUT");
  await updateWaitlistEntryStatus(salon.id,id,status as "waiting"|"contacted"|"booked"|"cancelled");
  revalidatePath("/app/waitlist");
  revalidatePath("/app/today");
}
