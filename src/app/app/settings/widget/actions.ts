"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function saveWidgetSettings(formData:FormData){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");
  const buttonLabel=String(formData.get("buttonLabel")??"").trim();
  const accentColor=String(formData.get("accentColor")??"").trim();
  const width=Number(formData.get("width")??420);
  const height=Number(formData.get("height")??720);
  if(!buttonLabel||buttonLabel.length>60||!/^#[0-9A-Fa-f]{6}$/.test(accentColor)||!Number.isInteger(width)||width<280||width>1200||!Number.isInteger(height)||height<420||height>1400)redirect("/app/settings/widget?error=Controleer+label,+kleur+en+afmetingen.");
  const db=createAdminSupabaseClient();
  const {error}=await db.from("booking_widget_settings").upsert({salon_id:salon.id,button_label:buttonLabel,accent_color:accentColor,width,height,updated_at:new Date().toISOString()},{onConflict:"salon_id"});
  if(error)redirect("/app/settings/widget?error=Widgetinstellingen+konden+niet+worden+opgeslagen.");
  revalidatePath("/app/settings/widget");revalidatePath(`/embed/${salon.slug}`);
  redirect("/app/settings/widget?saved=1");
}
