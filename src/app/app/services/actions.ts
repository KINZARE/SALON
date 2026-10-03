"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ServiceSchema, CategorySchema, MoneyInputSchema } from "@/lib/schemas";
import { normalizePaymentPolicy } from "@/domain/payment-policy";
import { saveWorkspaceService } from "@/services/workspace-mutations";

const cents=(value:string)=>{const result=MoneyInputSchema.safeParse(value);return result.success?result.data:null};

export async function saveService(formData:FormData){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");
  const id=String(formData.get("id")??"");
  const name=String(formData.get("name")??"").trim();
  const description=String(formData.get("description")??"").trim();
  const categoryId=String(formData.get("categoryId")??"").trim();
  const duration=Number(formData.get("duration")??0);
  const buffer=Number(formData.get("buffer")??0);
  const priceCents=cents(String(formData.get("price")??""));
  const rawDeposit=String(formData.get("deposit")??"").trim();
  const depositCents=rawDeposit?cents(rawDeposit):null;
  const paymentMode=String(formData.get("paymentMode")??"pay_in_salon");
  const staffIds=formData.getAll("staffIds").map(String);
  if(priceCents===null||!ServiceSchema.safeParse({id,name,categoryId,duration,buffer,priceCents,depositCents,staffIds,paymentMode}).success)redirect("/app/services?error=Controleer+naam,+duur,+buffer+en+prijs.");
  let policy;try{policy=normalizePaymentPolicy({mode:paymentMode,depositCents,priceCents})}catch{redirect("/app/services?error=Controleer+de+betaalregel+en+aanbetaling.")}
  try{
    await saveWorkspaceService(salon.id,{id:id||undefined,name,description,category_id:categoryId||null,duration_minutes:duration,buffer_minutes:buffer,price_cents:priceCents,active:formData.get("active")==="on",online_bookable:formData.get("onlineBookable")==="on",staff_ids:staffIds,payment_mode:policy.mode,deposit_cents:policy.depositCents});
  }catch(error){console.error("service_save_failed",{error});redirect("/app/services?error=Behandeling+kon+niet+worden+opgeslagen.")}
  revalidatePath("/app/services");revalidatePath("/app/calendar");revalidatePath(`/book/${salon.slug}`);redirect("/app/services?saved=1");
}

export async function saveCategory(formData:FormData){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");
  const id=String(formData.get("id")??"");
  const name=String(formData.get("name")??"").trim();
  const sortOrder=Number(formData.get("sortOrder")??0);
  const active=formData.get("active")==="on";
  if(!CategorySchema.safeParse({id,name,sortOrder}).success)redirect("/app/services?error=Controleer+de+categorie.");
  const db=createAdminSupabaseClient();
  const result=id
    ?await db.from("service_categories").update({name,sort_order:sortOrder,active,updated_at:new Date().toISOString()}).eq("salon_id",salon.id).eq("id",id)
    :await db.from("service_categories").insert({salon_id:salon.id,name,sort_order:sortOrder,active});
  if(result.error){console.error("category_save_failed",{error:result.error});redirect("/app/services?error=Categorie+kon+niet+worden+opgeslagen.")}
  revalidatePath("/app/services");revalidatePath(`/book/${salon.slug}`);redirect("/app/services?categorySaved=1");
}
