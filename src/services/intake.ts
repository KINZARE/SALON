import "server-only";
import { generateSecureToken,hashSecureToken } from "@/domain/secure-token";
import { validateIntakeAnswers,type IntakeCondition,type IntakeFieldType } from "@/domain/intake-form";
import { buildIntakePublicPath,normalizeIntakeSignature } from "@/domain/intake-signature";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isMissingSchemaFeatureError } from "@/lib/supabase/schema-compat";

type SnapshotField={
  id:string;
  label:string;
  type:IntakeFieldType;
  required:boolean;
  options:string[];
  sortOrder:number;
  condition?:IntakeCondition;
};
export type IntakeSnapshot={
  title:string;
  description:string;
  consentStatement:string;
  fields:SnapshotField[];
};

const eligibleStatuses=new Set(["pending","confirmed"]);

export async function getAppointmentIntakeState(salonId:string,appointmentId:string,serviceId:string|null){
  const db=createAdminSupabaseClient();
  if(!serviceId)return{forms:[],submissions:[]};
  const [linksResult,formsResult,submissionsResult]=await Promise.all([
    db.from("intake_form_services").select("form_id").eq("salon_id",salonId).eq("service_id",serviceId),
    db.from("intake_forms").select("id,title,active,version").eq("salon_id",salonId).eq("active",true).order("title"),
    db.from("intake_submissions").select("id,form_id,form_version,submitted_at").eq("salon_id",salonId).eq("appointment_id",appointmentId).order("submitted_at",{ascending:false}),
  ]);
  if(linksResult.error)throw linksResult.error;if(formsResult.error)throw formsResult.error;if(submissionsResult.error)throw submissionsResult.error;
  const linked=new Set((linksResult.data??[]).map(row=>row.form_id));
  return{forms:(formsResult.data??[]).filter(form=>linked.has(form.id)),submissions:submissionsResult.data??[]};
}

export async function issueAppointmentIntakeToken(args:{salonId:string;appointmentId:string;formId:string}){
  const db=createAdminSupabaseClient();
  const appointmentResult=await db.from("appointments").select("id,salon_id,service_id,starts_at,status").eq("salon_id",args.salonId).eq("id",args.appointmentId).maybeSingle();
  if(appointmentResult.error)throw appointmentResult.error;
  const appointment=appointmentResult.data;
  if(!appointment?.service_id)throw new Error("INTAKE_FORM_NOT_AVAILABLE");

  const formPromise=db.from("intake_forms").select("id,title,description,active,version,consent_statement").eq("salon_id",args.salonId).eq("id",args.formId).eq("active",true).maybeSingle();
  const linkPromise=db.from("intake_form_services").select("form_id,service_id").eq("salon_id",args.salonId).eq("form_id",args.formId).eq("service_id",appointment.service_id).maybeSingle();
  const fieldsResult=await db.from("intake_form_fields").select("id,form_id,label,field_type,required,options,sort_order,condition").eq("salon_id",args.salonId).eq("form_id",args.formId).order("sort_order");
  const [formResult,linkResult]=await Promise.all([formPromise,linkPromise]);
  if(formResult.error)throw formResult.error;if(linkResult.error)throw linkResult.error;

  let fieldRows;
  if(fieldsResult.error){
    if(!isMissingSchemaFeatureError(fieldsResult.error,["condition"]))throw fieldsResult.error;
    const legacy=await db.from("intake_form_fields").select("id,form_id,label,field_type,required,options,sort_order").eq("salon_id",args.salonId).eq("form_id",args.formId).order("sort_order");
    if(legacy.error)throw legacy.error;
    fieldRows=(legacy.data??[]).map(field=>({...field,condition:undefined}));
  }else{
    fieldRows=fieldsResult.data??[];
  }

  const form=formResult.data;const formLink=linkResult.data;
  if(!form||!formLink)throw new Error("INTAKE_FORM_NOT_AVAILABLE");
  if(!eligibleStatuses.has(appointment.status)||new Date(appointment.starts_at)<=new Date())throw new Error("APPOINTMENT_NOT_INTAKE_ELIGIBLE");

  const snapshot:IntakeSnapshot={
    title:form.title,
    description:form.description??"",
    consentStatement:form.consent_statement??"",
    fields:fieldRows.map(field=>({
      id:field.id,label:field.label,type:field.field_type as IntakeFieldType,required:field.required,
      options:Array.isArray(field.options)?field.options.filter((value):value is string=>typeof value==="string"):[],
      sortOrder:field.sort_order,
      condition:(field.condition??undefined) as IntakeCondition|undefined,
    })),
  };
  if(!snapshot.fields.length)throw new Error("INTAKE_FORM_EMPTY");

  const token=generateSecureToken();
  const tokenHash=hashSecureToken(token);
  const appointmentEnd=new Date(new Date(appointment.starts_at).getTime()+24*60*60*1000);
  const hardEnd=new Date(Date.now()+30*24*60*60*1000);
  const expiresAt=new Date(Math.min(appointmentEnd.getTime(),hardEnd.getTime())).toISOString();

  const cleanup=await db.from("appointment_intake_links").delete()
    .eq("salon_id",args.salonId).eq("appointment_id",args.appointmentId).eq("form_id",args.formId).is("completed_at",null);
  if(cleanup.error)throw cleanup.error;
  const {error}=await db.from("appointment_intake_links").insert({
    salon_id:args.salonId,
    appointment_id:args.appointmentId,
    form_id:args.formId,
    form_version:form.version,
    token_hash:tokenHash,
    expires_at:expiresAt,
    form_snapshot:snapshot,
  });
  if(error)throw error;
  return{token,expiresAt,formTitle:form.title,publicPath:buildIntakePublicPath(token)};
}

export async function getPublicIntakeContext(rawToken:string){
  if(!rawToken||rawToken.length<40)return null;
  const db=createAdminSupabaseClient();
  const tokenHash=hashSecureToken(rawToken);
  const {data:link,error}=await db.from("appointment_intake_links")
    .select("id,salon_id,appointment_id,form_id,form_version,form_snapshot,expires_at,completed_at")
    .eq("token_hash",tokenHash).maybeSingle();
  if(error)throw error;
  if(!link||link.completed_at||new Date(link.expires_at)<=new Date())return null;
  const [appointmentResult,salonResult]=await Promise.all([
    db.from("appointments").select("id,customer_name_snapshot,service_name_snapshot,starts_at,status").eq("salon_id",link.salon_id).eq("id",link.appointment_id).maybeSingle(),
    db.from("salons").select("id,name,timezone").eq("id",link.salon_id).maybeSingle(),
  ]);
  if(appointmentResult.error)throw appointmentResult.error;if(salonResult.error)throw salonResult.error;
  if(!appointmentResult.data||!salonResult.data)return null;
  const snapshot=link.form_snapshot as IntakeSnapshot;
  if(!snapshot||!Array.isArray(snapshot.fields))return null;
  return{tokenHash,link,appointment:appointmentResult.data,salon:salonResult.data,snapshot};
}

export async function submitPublicIntake(rawToken:string,customerName:string,answers:Record<string,unknown>,consentAccepted:boolean,signatureName?:string){
  const context=await getPublicIntakeContext(rawToken);
  if(!context)throw new Error("FORM_LINK_INVALID");
  const normalized=validateIntakeAnswers(context.snapshot.fields.map(field=>({id:field.id,type:field.type,required:field.required,options:field.options,sortOrder:field.sortOrder,condition:field.condition})),answers);
  const signature=context.snapshot.consentStatement?normalizeIntakeSignature(signatureName??""):null;
  const db=createAdminSupabaseClient();
  const {data,error}=await db.rpc("submit_intake_form",{
    p_token_hash:context.tokenHash,
    p_customer_name:customerName,
    p_answers:normalized,
    p_consent_accepted:consentAccepted,
    p_signature_name:signature,
  });
  if(error)throw new Error(error.message);
  return data as string;
}

export async function getIntakeSubmissionDetail(salonId:string,submissionId:string){
  const db=createAdminSupabaseClient();
  const {data:submission,error}=await db.from("intake_submissions")
    .select("id,appointment_id,customer_id,form_id,form_version,answers,submitted_at")
    .eq("salon_id",salonId).eq("id",submissionId).maybeSingle();
  if(error)throw error;if(!submission)return null;
  const [linkResult,formResult,customerResult]=await Promise.all([
    db.from("appointment_intake_links").select("form_snapshot").eq("salon_id",salonId).eq("appointment_id",submission.appointment_id).eq("form_id",submission.form_id).eq("form_version",submission.form_version).not("completed_at","is",null).order("completed_at",{ascending:false}).limit(1).maybeSingle(),
    db.from("intake_forms").select("title").eq("salon_id",salonId).eq("id",submission.form_id).maybeSingle(),
    db.from("customers").select("name").eq("salon_id",salonId).eq("id",submission.customer_id).maybeSingle(),
  ]);
  if(linkResult.error)throw linkResult.error;if(formResult.error)throw formResult.error;if(customerResult.error)throw customerResult.error;
  return{...submission,snapshot:(linkResult.data?.form_snapshot??null) as IntakeSnapshot|null,formTitle:formResult.data?.title??"Intake",customerName:customerResult.data?.name??"Klant"};
}
