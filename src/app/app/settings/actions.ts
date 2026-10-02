"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { saveWorkspaceEntity } from "@/services/workspace-mutations";

export async function saveSettings(formData:FormData){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");
  const name=String(formData.get("name")??"").trim();
  const phone=String(formData.get("phone")??"").trim();
  const email=String(formData.get("email")??"").trim();
  const address=String(formData.get("address")??"").trim();
  const slotInterval=Number(formData.get("slotInterval")??15);
  const minLead=Number(formData.get("minLead")??60);
  const maxDays=Number(formData.get("maxDays")??90);
  const cancellationHours=Number(formData.get("cancellationHours")??24);
  if(!name||name.length>120||email.length>254||phone.length>60||address.length>300||![5,10,15,20,30,60].includes(slotInterval)||!Number.isInteger(minLead)||minLead<0||!Number.isInteger(maxDays)||maxDays<1||maxDays>365||!Number.isInteger(cancellationHours)||cancellationHours<0){
    redirect("/app/settings?error=Controleer+de+salon-+en+bookinginstellingen.");
  }
  const openingHours=Array.from({length:7},(_,weekday)=>{
    const is_open=formData.get(`open-${weekday}`)==="on";
    const start_time=String(formData.get(`start-${weekday}`)??"09:00");
    const end_time=String(formData.get(`end-${weekday}`)??"18:00");
    if(is_open&&(!/^\d{2}:\d{2}$/.test(start_time)||!/^\d{2}:\d{2}$/.test(end_time)||start_time>=end_time)){
      redirect("/app/settings?error=Controleer+de+openingstijden.");
    }
    return{weekday,is_open,start_time:is_open?start_time:null,end_time:is_open?end_time:null};
  });
  try{
    await saveWorkspaceEntity(salon.id,"settings",{
      salon:{name,phone,email,address},
      settings:{
        slot_interval_minutes:slotInterval,min_lead_minutes:minLead,max_days_ahead:maxDays,
        allow_staff_choice:formData.get("allowStaffChoice")==="on",cancellation_hours:cancellationHours
      },
      openingHours
    });
  }catch(error){
    const message=error instanceof Error?error.message:"";
    console.error("settings_save_failed",{message});
    redirect(message.includes("APPOINTMENTS_IN_SCHEDULE")
      ?"/app/settings?error=Deze+openingstijden+maken+bestaande+toekomstige+afspraken+ongeldig.+Verplaats+die+eerst."
      :"/app/settings?error=Instellingen+konden+niet+worden+opgeslagen.");
  }
  revalidatePath("/app/settings");revalidatePath("/app/calendar");revalidatePath("/app/today");revalidatePath(`/book/${salon.slug}`);
  redirect("/app/settings?saved=1");
}
