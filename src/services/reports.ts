import "server-only";
import { fromZonedTime } from "date-fns-tz";
import { calculateAppointmentKpis, calculateCustomerMix, validCustomerHistoryStatuses } from "@/domain/reporting";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ReportAppointment={
  id:string;
  customer_id:string;
  staff_id:string;
  service_id:string|null;
  starts_at:string;
  status:string;
  customer_name_snapshot:string|null;
  service_name_snapshot:string;
  price_cents_snapshot:number;
  currency_snapshot:string;
  staff:{name:string}|null;
};

export async function getReportAppointments(args:{salonId:string;timezone:string;from:string;toExclusive:string}){
  const db=createAdminSupabaseClient();
  const fromIso=fromZonedTime(`${args.from}T00:00:00`,args.timezone).toISOString();
  const toIso=fromZonedTime(`${args.toExclusive}T00:00:00`,args.timezone).toISOString();
  const {data,error}=await db.from("appointments")
    .select("id,customer_id,staff_id,service_id,starts_at,status,customer_name_snapshot,service_name_snapshot,price_cents_snapshot,currency_snapshot,staff:staff!appointments_salon_id_staff_id_fkey(name)")
    .eq("salon_id",args.salonId)
    .gte("starts_at",fromIso)
    .lt("starts_at",toIso)
    .order("starts_at");
  if(error)throw error;
  return(data??[]).map(row=>({...row,staff:row.staff?.[0]??null})) as ReportAppointment[];
}

export async function getReturningCustomerIds(args:{salonId:string;timezone:string;before:string;customerIds:string[]}){
  if(!args.customerIds.length)return new Set<string>();
  const db=createAdminSupabaseClient();
  const beforeIso=fromZonedTime(`${args.before}T00:00:00`,args.timezone).toISOString();
  const {data,error}=await db.from("appointments")
    .select("customer_id")
    .eq("salon_id",args.salonId)
    .lt("starts_at",beforeIso)
    .in("status",[...validCustomerHistoryStatuses])
    .in("customer_id",args.customerIds)
    .limit(5000);
  if(error)throw error;
  return new Set((data??[]).map(row=>row.customer_id));
}

export function buildReportSummary(rows:ReportAppointment[],returningBeforePeriod:Set<string>){
  const kpis=calculateAppointmentKpis(rows);
  const customerMix=calculateCustomerMix(rows,returningBeforePeriod);

  const serviceMap=new Map<string,{name:string;appointments:number;completed:number;completedValueCents:number}>();
  const staffMap=new Map<string,{name:string;appointments:number;completed:number;completedValueCents:number}>();
  for(const row of rows){
    if(row.status==="cancelled")continue;
    const serviceKey=row.service_id??`snapshot:${row.service_name_snapshot}`;
    const service=serviceMap.get(serviceKey)??{name:row.service_name_snapshot,appointments:0,completed:0,completedValueCents:0};
    service.appointments+=1;
    if(row.status==="completed"){service.completed+=1;service.completedValueCents+=row.price_cents_snapshot}
    serviceMap.set(serviceKey,service);

    const staff=staffMap.get(row.staff_id)??{name:row.staff?.name??"Medewerker",appointments:0,completed:0,completedValueCents:0};
    staff.appointments+=1;
    if(row.status==="completed"){staff.completed+=1;staff.completedValueCents+=row.price_cents_snapshot}
    staffMap.set(row.staff_id,staff);
  }

  return{
    plannedValueCents:kpis.plannedValueCents,
    completedValueCents:kpis.completedValueCents,
    appointments:kpis.appointments,
    completed:kpis.completed,
    averageCompletedValueCents:kpis.averageCompletedValueCents,
    cancellations:kpis.cancellations,
    cancellationRate:kpis.cancellationRate,
    noShows:kpis.noShows,
    noShowRate:kpis.noShowRate,
    newCustomers:customerMix.newCustomers,
    returningCustomers:customerMix.returningCustomers,
    services:[...serviceMap.values()].sort((a,b)=>b.completedValueCents-a.completedValueCents||b.appointments-a.appointments),
    staff:[...staffMap.values()].sort((a,b)=>b.completedValueCents-a.completedValueCents||b.appointments-a.appointments),
  };
}
