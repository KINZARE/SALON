import "server-only";
import { fromZonedTime } from "date-fns-tz";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isMissingSchemaFeatureError } from "@/lib/supabase/schema-compat";
import { isUuid } from "@/lib/validation";

export async function getAppointmentsForRange(salonId:string,timezone:string,fromDate:string,toDateExclusive:string,staffId?:string|null){
  if(staffId&&!isUuid(staffId))return [];
  const db=createAdminSupabaseClient();
  const from=fromZonedTime(`${fromDate}T00:00:00`,timezone);
  const to=fromZonedTime(`${toDateExclusive}T00:00:00`,timezone);
  let query=db.from("appointments")
    .select("id,starts_at,status,customer_name_snapshot,service_name_snapshot,staff_id,staff:staff!appointments_salon_id_staff_id_fkey(name)")
    .eq("salon_id",salonId).gte("starts_at",from.toISOString()).lt("starts_at",to.toISOString()).order("starts_at");
  if(staffId)query=query.eq("staff_id",staffId);
  const {data,error}=await query;
  if(error)throw error;
  return(data??[]).map(row=>({...row,staff:row.staff?.[0]??null}));
}

export async function getMonthAppointments(salonId:string,timezone:string,fromDate:string,toDateExclusive:string){
  const db=createAdminSupabaseClient();
  const from=fromZonedTime(`${fromDate}T00:00:00`,timezone);
  const to=fromZonedTime(`${toDateExclusive}T00:00:00`,timezone);
  const {data,error}=await db.from("appointments").select("starts_at,status")
    .eq("salon_id",salonId).gte("starts_at",from.toISOString()).lt("starts_at",to.toISOString());
  if(error)throw error;
  return data??[];
}

export async function getServiceCategories(salonId:string){
  const db=createAdminSupabaseClient();
  const {data,error}=await db.from("service_categories").select("id,name,sort_order,active").eq("salon_id",salonId).order("sort_order").order("name");
  if(error)throw error;return data??[];
}

export async function getOpeningExceptions(salonId:string,fromDate:string,toDate?:string){
  const db=createAdminSupabaseClient();
  let query=db.from("opening_exceptions").select("id,exception_date,is_open,start_time,end_time,note").eq("salon_id",salonId).gte("exception_date",fromDate).order("exception_date");
  query=toDate?query.lte("exception_date",toDate):query.limit(120);
  const {data,error}=await query;
  if(error)throw error;return data??[];
}

export async function getStaffScheduleOverrides(salonId:string,fromDate:string){
  const db=createAdminSupabaseClient();
  const {data,error}=await db.from("staff_schedule_overrides").select("id,staff_id,override_date,is_working,start_time,end_time,reason").eq("salon_id",salonId).gte("override_date",fromDate).order("override_date").limit(240);
  if(error)throw error;return data??[];
}

export async function getIntakeForms(salonId:string){
  const db=createAdminSupabaseClient();
  const formsPromise=db.from("intake_forms").select("id,title,description,active,version,consent_statement,updated_at").eq("salon_id",salonId).order("updated_at",{ascending:false});
  const linksPromise=db.from("intake_form_services").select("form_id,service_id").eq("salon_id",salonId);
  const fieldsResult=await db.from("intake_form_fields").select("id,form_id,label,field_type,required,options,sort_order,condition").eq("salon_id",salonId).order("sort_order");
  const [forms,links]=await Promise.all([formsPromise,linksPromise]);
  if(forms.error)throw forms.error;if(links.error)throw links.error;

  let fieldRows;
  if(fieldsResult.error){
    if(!isMissingSchemaFeatureError(fieldsResult.error,["condition"]))throw fieldsResult.error;
    const legacy=await db.from("intake_form_fields").select("id,form_id,label,field_type,required,options,sort_order").eq("salon_id",salonId).order("sort_order");
    if(legacy.error)throw legacy.error;
    fieldRows=(legacy.data??[]).map(field=>({...field,condition:null}));
  }else{
    fieldRows=fieldsResult.data??[];
  }

  return(forms.data??[]).map(form=>({...form,fields:fieldRows.filter(field=>field.form_id===form.id),service_ids:(links.data??[]).filter(link=>link.form_id===form.id).map(link=>link.service_id)}));
}

export async function getWidgetSettings(salonId:string){
  const db=createAdminSupabaseClient();
  const {data,error}=await db.from("booking_widget_settings").select("button_label,accent_color,width,height").eq("salon_id",salonId).maybeSingle();
  if(error)throw error;return data??{button_label:"Boek afspraak",accent_color:"#B66B4D",width:420,height:720};
}

export async function getCustomerIntakeSummary(salonId:string,customerId:string){
  const db=createAdminSupabaseClient();
  const [submissions,consents]=await Promise.all([
    db.from("intake_submissions").select("id,appointment_id,form_id,form_version,submitted_at").eq("salon_id",salonId).eq("customer_id",customerId).order("submitted_at",{ascending:false}).limit(25),
    db.from("appointment_consents").select("id,appointment_id,statement,statement_version,consented_at").eq("salon_id",salonId).eq("customer_id",customerId).order("consented_at",{ascending:false}).limit(25),
  ]);
  if(submissions.error)throw submissions.error;if(consents.error)throw consents.error;
  return{submissions:submissions.data??[],consents:consents.data??[]};
}