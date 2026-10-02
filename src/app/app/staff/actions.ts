"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { saveWorkspaceEntity } from "@/services/workspace-mutations";

export async function saveStaff(formData:FormData){
  const {salon,membership}=await requireAppContext();if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");
  const id=String(formData.get("id")??"");const name=String(formData.get("name")??"").trim();const email=String(formData.get("email")??"").trim();const role=String(formData.get("role")??"staff");const serviceIds=formData.getAll("serviceIds").map(String);
  if(!name||name.length>120||email.length>254||!["owner","manager","staff"].includes(role)||!serviceIds.length)redirect("/app/staff?error=Controleer+naam,+rol+en+behandelingen.");
  const schedules=[] as Array<{weekday:number;is_working:boolean;start_time:string|null;end_time:string|null}>;const breaks=[] as Array<{weekday:number;start_time:string;end_time:string}>;
  for(let weekday=0;weekday<7;weekday+=1){const working=formData.get(`working-${weekday}`)==="on";const start=String(formData.get(`start-${weekday}`)??"09:00");const end=String(formData.get(`end-${weekday}`)??"18:00");if(working&&(!/^\d{2}:\d{2}$/.test(start)||!/^\d{2}:\d{2}$/.test(end)||start>=end))redirect("/app/staff?error=Controleer+het+weekrooster.");schedules.push({weekday,is_working:working,start_time:working?start:null,end_time:working?end:null});const breakStart=String(formData.get(`break-start-${weekday}`)??"");const breakEnd=String(formData.get(`break-end-${weekday}`)??"");if(breakStart||breakEnd){if(!working||!/^\d{2}:\d{2}$/.test(breakStart)||!/^\d{2}:\d{2}$/.test(breakEnd)||breakStart>=breakEnd||breakStart<start||breakEnd>end)redirect("/app/staff?error=Een+pauze+moet+binnen+de+werktijd+vallen.");breaks.push({weekday,start_time:breakStart,end_time:breakEnd})}}
  try{await saveWorkspaceEntity(salon.id,"staff",{id:id||undefined,name,email,role,active:formData.get("active")==="on",service_ids:serviceIds,schedules,breaks})}
  catch(error){const message=error instanceof Error?error.message:"";console.error("staff_save_failed",{message});redirect(message.includes("APPOINTMENTS_IN_SCHEDULE")?"/app/staff?error=Dit+rooster+maakt+bestaande+toekomstige+afspraken+ongeldig.+Verplaats+die+eerst.":"/app/staff?error=Medewerker+kon+niet+worden+opgeslagen.")}
  revalidatePath("/app/staff");revalidatePath("/app/calendar");redirect("/app/staff?saved=1");
}
