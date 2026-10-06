import "server-only";

import { formatInTimeZone } from "date-fns-tz";
import { waitlistEntryMatchesGap } from "@/domain/waitlist";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getPublicSalon, getPublicStaffForService } from "@/services/public-booking";

export type WaitlistGap = {
  staffId: string;
  staffName: string;
  start: Date;
  end: Date;
  durationMinutes: number;
};

export async function joinPublicWaitlist(args:{
  salonSlug:string;
  serviceId:string;
  staffId?:string|null;
  date:string;
  customer:{name:string;phone?:string|null;email?:string|null};
}){
  const name=args.customer.name.trim();
  const phone=args.customer.phone?.trim()||null;
  const email=args.customer.email?.trim().toLowerCase()||null;
  if(!name||name.length>160||(!phone&&!email)||!/^\d{4}-\d{2}-\d{2}$/.test(args.date))throw new Error("INVALID_WAITLIST_REQUEST");

  const salon=await getPublicSalon(args.salonSlug);
  if(!salon)throw new Error("SALON_NOT_FOUND");
  const today=formatInTimeZone(new Date(),salon.timezone,"yyyy-MM-dd");
  if(args.date<today)throw new Error("INVALID_WAITLIST_DATE");

  const db=createAdminSupabaseClient();
  const {data:service,error:serviceError}=await db.from("services")
    .select("id")
    .eq("id",args.serviceId).eq("salon_id",salon.id).eq("active",true).eq("online_bookable",true).maybeSingle();
  if(serviceError)throw serviceError;
  if(!service)throw new Error("SERVICE_NOT_FOUND");

  if(args.staffId){
    const eligible=await getPublicStaffForService(salon.id,args.serviceId);
    if(!eligible.some(member=>member.id===args.staffId))throw new Error("STAFF_NOT_ELIGIBLE");
  }

  const duplicateQuery=db.from("waitlist_entries").select("id")
    .eq("salon_id",salon.id).eq("service_id",args.serviceId).eq("requested_from",args.date).eq("status","waiting");
  const {data:existing,error:existingError}=email
    ? await duplicateQuery.eq("email",email).limit(1)
    : await duplicateQuery.eq("phone",phone!).limit(1);
  if(existingError)throw existingError;
  if(existing?.length)return existing[0].id;

  const {data,error}=await db.from("waitlist_entries").insert({
    salon_id:salon.id,
    service_id:args.serviceId,
    preferred_staff_id:args.staffId??null,
    customer_name:name,
    phone,
    email,
    requested_from:args.date,
    requested_to:args.date,
    status:"waiting",
    source:"public_booking",
  }).select("id").single();
  if(error)throw error;
  return data.id as string;
}

export async function getWaitlistEntries(salonId:string){
  const db=createAdminSupabaseClient();
  const [entriesResult,servicesResult,staffResult]=await Promise.all([
    db.from("waitlist_entries").select("id,service_id,preferred_staff_id,customer_name,phone,email,requested_from,requested_to,status,created_at").eq("salon_id",salonId).in("status",["waiting","contacted"]).order("requested_from").order("created_at").limit(200),
    db.from("services").select("id,name,duration_minutes,buffer_minutes").eq("salon_id",salonId),
    db.from("staff").select("id,name").eq("salon_id",salonId),
  ]);
  for(const result of [entriesResult,servicesResult,staffResult])if(result.error)throw result.error;
  const services=new Map((servicesResult.data??[]).map(item=>[item.id,item]));
  const staff=new Map((staffResult.data??[]).map(item=>[item.id,item]));
  return (entriesResult.data??[]).map(item=>({
    ...item,
    service:services.get(item.service_id)??null,
    preferredStaff:item.preferred_staff_id?staff.get(item.preferred_staff_id)??null:null,
  }));
}

export async function updateWaitlistEntryStatus(salonId:string,id:string,status:"waiting"|"contacted"|"booked"|"cancelled"){
  const db=createAdminSupabaseClient();
  const {error}=await db.from("waitlist_entries").update({status,updated_at:new Date().toISOString()}).eq("id",id).eq("salon_id",salonId);
  if(error)throw error;
}

export async function findWaitlistMatchesForGaps(salonId:string,date:string,gaps:WaitlistGap[]){
  if(!gaps.length)return [];
  const db=createAdminSupabaseClient();
  const {data:entries,error}=await db.from("waitlist_entries")
    .select("id,service_id,preferred_staff_id,customer_name,phone,email,requested_from,requested_to")
    .eq("salon_id",salonId).eq("status","waiting").lte("requested_from",date).gte("requested_to",date).limit(200);
  if(error)throw error;
  if(!entries?.length)return [];

  const serviceIds=[...new Set(entries.map(item=>item.service_id))];
  const [servicesResult,linksResult]=await Promise.all([
    db.from("services").select("id,name,duration_minutes,buffer_minutes").eq("salon_id",salonId).in("id",serviceIds),
    db.from("staff_services").select("service_id,staff_id").eq("salon_id",salonId).in("service_id",serviceIds),
  ]);
  if(servicesResult.error)throw servicesResult.error;
  if(linksResult.error)throw linksResult.error;
  const services=new Map((servicesResult.data??[]).map(item=>[item.id,item]));

  const matches=[];
  for(const entry of entries){
    const service=services.get(entry.service_id);
    if(!service)continue;
    const eligibleStaffIds=(linksResult.data??[]).filter(link=>link.service_id===entry.service_id).map(link=>link.staff_id);
    for(const gap of gaps){
      if(waitlistEntryMatchesGap({
        gapDate:date,
        gapStaffId:gap.staffId,
        gapDurationMinutes:gap.durationMinutes,
        windowStart:entry.requested_from,
        windowEnd:entry.requested_to,
        preferredStaffId:entry.preferred_staff_id,
        eligibleStaffIds,
        serviceDurationMinutes:service.duration_minutes,
        bufferMinutes:service.buffer_minutes,
      })){
        matches.push({entryId:entry.id,customerName:entry.customer_name,serviceId:entry.service_id,serviceName:service.name,phone:entry.phone,email:entry.email,gap});
        break;
      }
    }
  }
  return matches;
}
