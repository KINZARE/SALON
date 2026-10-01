"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { parseUnambiguousLocalDateTime } from "@/domain/local-time";
import { saveWorkspaceEntity } from "@/services/workspace-mutations";

export async function createBlock(formData:FormData){
  const {salon,membership}=await requireAppContext();if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");
  const staffId=String(formData.get("staffId")??"").trim();const startLocal=String(formData.get("startsAt")??"");const endLocal=String(formData.get("endsAt")??"");const reason=String(formData.get("reason")??"").trim();
  const startsAt=parseUnambiguousLocalDateTime(startLocal,salon.timezone);const endsAt=parseUnambiguousLocalDateTime(endLocal,salon.timezone);
  if(!startsAt||!endsAt||startsAt>=endsAt)redirect("/app/blocks?error=Kies+geldige,+niet-dubbelzinnige+start-+en+eindtijden.");
  try{await saveWorkspaceEntity(salon.id,"block",{staff_id:staffId||null,starts_at:startsAt.toISOString(),ends_at:endsAt.toISOString(),reason})}
  catch(error){const message=error instanceof Error?error.message:"";redirect(message.includes("APPOINTMENTS_IN_BLOCK")?"/app/blocks?error=Dit+block+overlapt+een+bestaande+afspraak.":"/app/blocks?error=Block+kon+niet+worden+opgeslagen.")}
  revalidatePath("/app/blocks");revalidatePath("/app/calendar");redirect("/app/blocks?saved=1");
}
export async function deleteBlock(formData:FormData){
  const {salon,membership}=await requireAppContext();if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");const id=String(formData.get("id")??"");
  try{await saveWorkspaceEntity(salon.id,"deleteBlock",{id})}catch{redirect("/app/blocks?error=Block+kon+niet+worden+verwijderd.")}
  revalidatePath("/app/blocks");revalidatePath("/app/calendar");redirect("/app/blocks");
}
