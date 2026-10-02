"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { normalizePaymentPolicy } from "@/domain/payment-policy";
import { saveWorkspaceService } from "@/services/workspace-mutations";

const cents=(value:string)=>{const amount=Number(value.trim().replace(",","."));return Number.isFinite(amount)&&amount>=0?Math.round(amount*100):null};

export async function saveService(formData:FormData){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");

  const id=String(formData.get("id")??"");
  const name=String(formData.get("name")??"").trim();
  const description=String(formData.get("description")??"").trim();
  const duration=Number(formData.get("duration")??0);
  const buffer=Number(formData.get("buffer")??0);
  const priceCents=cents(String(formData.get("price")??""));
  const rawDeposit=String(formData.get("deposit")??"").trim();
  const depositCents=rawDeposit?cents(rawDeposit):null;
  const paymentMode=String(formData.get("paymentMode")??"pay_in_salon");
  const staffIds=formData.getAll("staffIds").map(String);

  if(!name||name.length>120||!Number.isInteger(duration)||duration<5||duration>720||!Number.isInteger(buffer)||buffer<0||buffer>180||priceCents===null){
    redirect("/app/services?error=Controleer+naam,+duur,+buffer+en+prijs.");
  }

  let policy;
  try{
    policy=normalizePaymentPolicy({mode:paymentMode,depositCents,priceCents});
  }catch{
    redirect("/app/services?error=Controleer+de+betaalregel+en+aanbetaling.");
  }

  try{
    await saveWorkspaceService(salon.id,{
      id:id||undefined,
      name,
      description,
      duration_minutes:duration,
      buffer_minutes:buffer,
      price_cents:priceCents,
      active:formData.get("active")==="on",
      online_bookable:formData.get("onlineBookable")==="on",
      staff_ids:staffIds,
      payment_mode:policy.mode,
      deposit_cents:policy.depositCents,
    });
  }catch(error){
    console.error("service_save_failed",{error});
    redirect("/app/services?error=Behandeling+kon+niet+worden+opgeslagen.");
  }

  revalidatePath("/app/services");
  revalidatePath("/app/calendar");
  revalidatePath(`/book/${salon.slug}`);
  redirect("/app/services?saved=1");
}
