import "server-only";
import { fromZonedTime } from "date-fns-tz";
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
    .in("customer_id",args.customerIds)
    .limit(5000);
  if(error)throw error;
  return new Set((data??[]).map(row=>row.customer_id));
}

export function buildReportSummary(rows:ReportAppointment[],returningBeforePeriod:Set<string>){
  const completed=rows.filter(row=>row.status==="completed");
  const revenueCents=completed.reduce((sum,row)=>sum+row.price_cents_snapshot,0);
  const averageCents=completed.length?Math.round(revenueCents/completed.length):0;
  const uniqueCustomers=[...new Set(rows.map(row=>row.customer_id))];
  const newCustomers=uniqueCustomers.filter(id=>!returningBeforePeriod.has(id)).length;
  const returningCustomers=uniqueCustomers.length-newCustomers;
  const repeatRate=uniqueCustomers.length?Math.round((returningCustomers/uniqueCustomers.length)*100):0;

  const serviceMap=new Map<string,{name:string;appointments:number;completed:number;revenueCents:number}>();
  const staffMap=new Map<string,{name:string;appointments:number;completed:number;revenueCents:number}>();
  for(const row of rows){
    const serviceKey=row.service_id??`snapshot:${row.service_name_snapshot}`;
    const service=serviceMap.get(serviceKey)??{name:row.service_name_snapshot,appointments:0,completed:0,revenueCents:0};
    service.appointments+=1;
    if(row.status==="completed"){service.completed+=1;service.revenueCents+=row.price_cents_snapshot}
    serviceMap.set(serviceKey,service);

    const staff=staffMap.get(row.staff_id)??{name:row.staff?.name??"Medewerker",appointments:0,completed:0,revenueCents:0};
    staff.appointments+=1;
    if(row.status==="completed"){staff.completed+=1;staff.revenueCents+=row.price_cents_snapshot}
    staffMap.set(row.staff_id,staff);
  }

  return{
    revenueCents,
    appointments:rows.length,
    completed:completed.length,
    averageCents,
    cancellations:rows.filter(row=>row.status==="cancelled").length,
    noShows:rows.filter(row=>row.status==="no_show").length,
    newCustomers,
    returningCustomers,
    repeatRate,
    services:[...serviceMap.values()].sort((a,b)=>b.revenueCents-a.revenueCents||b.appointments-a.appointments),
    staff:[...staffMap.values()].sort((a,b)=>b.revenueCents-a.revenueCents||b.appointments-a.appointments),
  };
}
