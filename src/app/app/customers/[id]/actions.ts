"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { saveWorkspaceEntity } from "@/services/workspace-mutations";
import { CustomerProfileSchema } from "@/lib/schemas";

export async function saveCustomer(formData:FormData){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");
  const id=String(formData.get("customerId")??"");
  const name=String(formData.get("name")??"").trim();
  const phone=String(formData.get("phone")??"").trim();
  const email=String(formData.get("email")??"").trim();
  const notes=String(formData.get("notes")??"").trim();
  if(!CustomerProfileSchema.safeParse({id,name,phone,email,notes}).success){
    redirect(`/app/customers/${id}?error=Controleer+de+klantgegevens.`);
  }
  try{await saveWorkspaceEntity(salon.id,"customer",{id,name,phone,email,internal_notes:notes})}
  catch{redirect(`/app/customers/${id}?error=Klant+kon+niet+worden+opgeslagen.`)}
  revalidatePath("/app/customers");revalidatePath(`/app/customers/${id}`);
  redirect(`/app/customers/${id}?saved=1`);
}
