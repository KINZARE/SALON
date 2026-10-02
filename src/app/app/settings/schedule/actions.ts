"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function manager(role:string){if(!["owner","manager"].includes(role))throw new Error("FORBIDDEN")}
function fail(error:{message?:string}|null){
  if(error?.message?.includes("APPOINTMENTS_IN_SCHEDULE"))redirect("/app/settings/schedule?error=Er+staan+nog+afspraken+die+met+deze+wijziging+conflicteren.");
  redirect("/app/settings/schedule?error=Wijziging+kon+niet+worden+opgeslagen.");
}

export async function saveOpeningException(formData:FormData){
  const {salon,membership}=await requireAppContext();manager(membership.role);
  const date=String(formData.get("date")??"");const isOpen=formData.get("isOpen")==="on";const start=isOpen?String(formData.get("start")??""):null;const end=isOpen?String(formData.get("end")??""):null;const note=String(formData.get("note")??"").trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isOpen&&(!/^\d{2}:\d{2}$/.test(start??"")||!/^\d{2}:\d{2}$/.test(end??"")))redirect("/app/settings/schedule?error=Controleer+datum+en+tijden.");
  const db=createAdminSupabaseClient();const {error}=await db.rpc("save_opening_exception",{p_salon_id:salon.id,p_date:date,p_is_open:isOpen,p_start:start,p_end:end,p_note:note||null});
  if(error)fail(error);revalidatePath("/app/settings/schedule");revalidatePath("/app/calendar");redirect("/app/settings/schedule?saved=opening");
}
export async function deleteOpeningException(formData:FormData){
  const {salon,membership}=await requireAppContext();manager(membership.role);const date=String(formData.get("date")??"");const db=createAdminSupabaseClient();
  const {error}=await db.rpc("delete_opening_exception",{p_salon_id:salon.id,p_date:date});if(error)fail(error);
  revalidatePath("/app/settings/schedule");revalidatePath("/app/calendar");redirect("/app/settings/schedule?deleted=opening");
}
export async function saveStaffOverride(formData:FormData){
  const {salon,membership}=await requireAppContext();manager(membership.role);
  const staffId=String(formData.get("staffId")??"");const date=String(formData.get("date")??"");const isWorking=formData.get("isWorking")==="on";const start=isWorking?String(formData.get("start")??""):null;const end=isWorking?String(formData.get("end")??""):null;const reason=String(formData.get("reason")??"").trim();
  if(!staffId||!/^\d{4}-\d{2}-\d{2}$/.test(date)||isWorking&&(!/^\d{2}:\d{2}$/.test(start??"")||!/^\d{2}:\d{2}$/.test(end??"")))redirect("/app/settings/schedule?error=Controleer+medewerker,+datum+en+tijden.");
  const db=createAdminSupabaseClient();const {error}=await db.rpc("save_staff_schedule_override",{p_salon_id:salon.id,p_staff_id:staffId,p_date:date,p_is_working:isWorking,p_start:start,p_end:end,p_reason:reason||null});
  if(error)fail(error);revalidatePath("/app/settings/schedule");revalidatePath("/app/calendar");redirect("/app/settings/schedule?saved=staff");
}
export async function deleteStaffOverride(formData:FormData){
  const {salon,membership}=await requireAppContext();manager(membership.role);const staffId=String(formData.get("staffId")??"");const date=String(formData.get("date")??"");const db=createAdminSupabaseClient();
  const {error}=await db.rpc("delete_staff_schedule_override",{p_salon_id:salon.id,p_staff_id:staffId,p_date:date});if(error)fail(error);
  revalidatePath("/app/settings/schedule");revalidatePath("/app/calendar");redirect("/app/settings/schedule?deleted=staff");
}
