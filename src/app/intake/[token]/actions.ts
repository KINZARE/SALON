"use server";
import { redirect } from "next/navigation";
import { getPublicIntakeContext,submitPublicIntake } from "@/services/intake";

export async function submitIntakeAction(token:string,formData:FormData){
  const context=await getPublicIntakeContext(token);
  if(!context)redirect("/intake/invalid");
  const answers:Record<string,unknown>={};
  for(const field of context.snapshot.fields){
    const raw=formData.get(`field:${field.id}`);
    if(field.type==="checkbox"||field.type==="consent")answers[field.id]=raw==="on";
    else answers[field.id]=raw==null?"":String(raw);
  }
  const customerName=String(formData.get("customerName")??context.appointment.customer_name_snapshot??"").trim();
  const consentAccepted=formData.get("__consent")==="on";
  try{await submitPublicIntake(token,customerName,answers,consentAccepted)}
  catch{redirect(`/intake/${token}?error=Controleer+de+verplichte+velden+en+toestemming.`)}
  redirect(`/intake/${token}?done=1`);
}
