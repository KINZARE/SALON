"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { isUuid } from "@/lib/validation";
import { cancelWaitlistOffer, createNextWaitlistOffer, updateWaitlistEntryStatus } from "@/services/waitlist";

export async function updateWaitlistStatusAction(formData:FormData){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");
  const id=String(formData.get("id")??"");
  const status=String(formData.get("status")??"");
  if(!isUuid(id)||!["waiting","contacted","booked","cancelled"].includes(status))redirect("/app/waitlist?error=Ongeldige+actie.");
  await updateWaitlistEntryStatus(salon.id,id,status as "waiting"|"contacted"|"booked"|"cancelled");
  revalidatePath("/app/waitlist");revalidatePath("/app/today");
}

export async function createWaitlistOfferAction(formData:FormData){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");
  const id=String(formData.get("id")??"");
  if(!isUuid(id))redirect("/app/waitlist?error=Ongeldige+wachtlijstactie.");
  try{
    await createNextWaitlistOffer(salon.id,id);
  }catch(error){
    console.error("waitlist_offer_create_failed",{error});
    redirect("/app/waitlist?error=Er+is+nu+geen+geldige+vrije+plek+binnen+de+gevraagde+periode.");
  }
  revalidatePath("/app/waitlist");revalidatePath("/app/today");
  redirect("/app/waitlist?offered=1");
}

export async function cancelWaitlistOfferAction(formData:FormData){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");
  const offerId=String(formData.get("offerId")??"");
  if(!isUuid(offerId))redirect("/app/waitlist?error=Ongeldig+aanbod.");
  await cancelWaitlistOffer(salon.id,offerId);
  revalidatePath("/app/waitlist");revalidatePath("/app/today");
}
