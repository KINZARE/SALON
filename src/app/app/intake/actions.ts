"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { validateIntakeDefinition } from "@/domain/intake-form";

export async function saveIntakeForm(formData:FormData){
  const {salon,membership}=await requireAppContext();
  if(!["owner","manager"].includes(membership.role))throw new Error("FORBIDDEN");

  const formId=String(formData.get("formId")??"").trim();
  const title=String(formData.get("title")??"").trim();
  const description=String(formData.get("description")??"").trim();
  const consentStatement=String(formData.get("consentStatement")??"").trim();
  const active=formData.get("active")==="on";
  const serviceIds=[...new Set(formData.getAll("serviceIds").map(String).filter(Boolean))];
  let fields;
  try{
    const raw=JSON.parse(String(formData.get("fieldsJson")??"[]")) as unknown;
    if(!Array.isArray(raw))throw new Error("INVALID_FIELDS");
    fields=validateIntakeDefinition({title,description,fields:raw as Parameters<typeof validateIntakeDefinition>[0]["fields"]}).fields;
  }catch{
    redirect("/app/intake?error=Controleer+de+velden+van+het+formulier.");
  }
  if(consentStatement.length>800)redirect("/app/intake?error=De+toestemmingstekst+is+te+lang.");

  const db=createAdminSupabaseClient();
  const {error}=await db.rpc("save_intake_form",{
    p_salon_id:salon.id,
    p_form_id:formId||null,
    p_title:title,
    p_description:description,
    p_active:active,
    p_consent_statement:consentStatement,
    p_fields:fields.map(field=>({label:field.label,type:field.type,required:field.required,options:field.options})),
    p_service_ids:serviceIds,
  });
  if(error){
    console.error("intake_form_save_failed",{code:error.code,message:error.message});
    redirect("/app/intake?error=Formulier+kon+niet+worden+opgeslagen.");
  }
  revalidatePath("/app/intake");
  redirect("/app/intake?saved=1");
}
