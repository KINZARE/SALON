import 'server-only';
import {createAdminSupabaseClient} from '@/lib/supabase/admin';
import {getAppointmentIntakeState,getIntakeSubmissionDetail} from '@/services/intake';
import {getWorkspaceServices} from '@/services/workspace-data';
import {getStaff} from '@/services/app-data';

export async function getDailyCatalog(salonId:string){
 const [allServices,allStaff]=await Promise.all([getWorkspaceServices(salonId),getStaff(salonId)]);
 const staff=allStaff.filter(s=>s.active).map(({id,name})=>({id,name}));
 const services=allServices.filter(s=>s.active).map(({id,name,duration_minutes})=>({id,name,duration_minutes}));
 return {services,staff,staffByService:Object.fromEntries(allServices.filter(s=>s.active).map(s=>[s.id,staff.filter(member=>s.staff_ids.includes(member.id))]))};
}
export async function getDailyAppointment(salonId:string,id:string,canManage:boolean){
 const db=createAdminSupabaseClient();
 const result=await db.from('appointments').select('id,customer_id,staff_id,service_id,customer_name_snapshot,service_name_snapshot,starts_at,service_ends_at,status,treatment_started_at,payment_status,price_cents_snapshot,currency_snapshot,note').eq('salon_id',salonId).eq('id',id).maybeSingle();
 if(result.error)throw result.error;if(!result.data)return null;
 const appointment=result.data;
 const [customerResult,intake]=await Promise.all([
  db.from('customers').select('id,name,phone,email,internal_notes').eq('salon_id',salonId).eq('id',appointment.customer_id).maybeSingle(),
  canManage?getAppointmentIntakeState(salonId,id,appointment.service_id):Promise.resolve({forms:[],submissions:[]}),
 ]);
 if(customerResult.error)throw customerResult.error;
 // Read customer history only for owners/managers; bounded and lazy.
 const [previous,next,consents]=canManage?await Promise.all([
  db.from('appointments').select('starts_at,service_name_snapshot').eq('salon_id',salonId).eq('customer_id',appointment.customer_id).eq('status','completed').order('starts_at',{ascending:false}).limit(1),
  db.from('appointments').select('starts_at,service_name_snapshot').eq('salon_id',salonId).eq('customer_id',appointment.customer_id).in('status',['pending','confirmed','checked_in']).gt('starts_at',new Date().toISOString()).order('starts_at').limit(1),
  db.from('appointment_consents').select('id,statement,consented_at').eq('salon_id',salonId).eq('customer_id',appointment.customer_id).order('consented_at',{ascending:false}).limit(10),
 ]):[{data:[],error:null},{data:[],error:null},{data:[],error:null}];
 for(const r of [previous,next,consents])if(r.error)throw r.error;
 return {appointment:canManage?appointment:{...appointment,price_cents_snapshot:0,payment_status:'hidden',note:null},customer:customerResult.data?{...customerResult.data,internal_notes:canManage?customerResult.data.internal_notes:null}:null,previous:previous.data?.[0]??null,next:next.data?.[0]??null,intake,consents:consents.data??[]};
}
export async function getDailyIntake(salonId:string,id:string){return getIntakeSubmissionDetail(salonId,id)}
