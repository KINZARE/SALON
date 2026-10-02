import "server-only";
import { differenceInCalendarDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { computeAvailability, type Interval } from "@/domain/availability";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type PublicSalon={id:string;slug:string;name:string;timezone:string;currency:string;allowStaffChoice:boolean};
export type PublicService={id:string;name:string;description:string|null;durationMinutes:number;priceCents:number;currency:string;categoryId:string|null;categoryName:string|null;categorySort:number};
export type PublicStaff={id:string;name:string};
export type PublicAvailability={salon:PublicSalon;staff:PublicStaff[];slots:Array<{start:string;serviceEnd:string;staffIds:string[]}>};

type ServiceRow={id:string;salon_id:string;name:string;description:string|null;duration_minutes:number;price_cents:number;currency:string;buffer_minutes:number;active:boolean;online_bookable:boolean;category_id:string|null};
type TimeRow={start_time:string;end_time:string};
type TimedRow={starts_at:string;ends_at:string};
type AppointmentRow={staff_id:string;starts_at:string;occupied_until:string};

function asLocalInterval(date:string,timezone:string,row:TimeRow):Interval{
  return{start:fromZonedTime(`${date}T${row.start_time}`,timezone),end:fromZonedTime(`${date}T${row.end_time}`,timezone)};
}
function isoInterval(row:TimedRow):Interval{return{start:new Date(row.starts_at),end:new Date(row.ends_at)}}

async function getSalonBySlug(slug:string):Promise<PublicSalon|null>{
  const db=createAdminSupabaseClient();
  const {data,error}=await db.from("salons").select("id,slug,name,timezone,currency,settings:booking_settings(allow_staff_choice)").eq("slug",slug).maybeSingle();
  if(error)throw error;if(!data)return null;
  const {settings:relatedSettings,...salon}=data;
  const relation=relatedSettings as unknown as {allow_staff_choice:boolean}|{allow_staff_choice:boolean}[]|null;
  const settings=Array.isArray(relation)?relation[0]:relation;
  return{...salon,allowStaffChoice:settings?.allow_staff_choice??true};
}

export async function getPublicSalon(slug:string){return getSalonBySlug(slug)}

export async function getPublicServices(salonId:string):Promise<PublicService[]>{
  const db=createAdminSupabaseClient();
  const [servicesResult,categoriesResult]=await Promise.all([
    db.from("services").select("id,name,description,duration_minutes,price_cents,currency,category_id").eq("salon_id",salonId).eq("active",true).eq("online_bookable",true).order("name"),
    db.from("service_categories").select("id,name,sort_order").eq("salon_id",salonId).eq("active",true).order("sort_order").order("name"),
  ]);
  if(servicesResult.error)throw servicesResult.error;if(categoriesResult.error)throw categoriesResult.error;
  const categories=new Map((categoriesResult.data??[]).map(row=>[row.id,row]));
  return(servicesResult.data??[]).map(row=>{
    const category=row.category_id?categories.get(row.category_id):null;
    return{id:row.id,name:row.name,description:row.description,durationMinutes:row.duration_minutes,priceCents:row.price_cents,currency:row.currency,categoryId:category?.id??null,categoryName:category?.name??null,categorySort:category?.sort_order??9999};
  }).sort((a,b)=>a.categorySort-b.categorySort||(a.categoryName??"").localeCompare(b.categoryName??"")||a.name.localeCompare(b.name));
}

export async function getPublicStaffByService(salonId:string,serviceIds:string[]):Promise<Record<string,PublicStaff[]>>{
  const byService:Record<string,PublicStaff[]>=Object.fromEntries([...new Set(serviceIds)].map(id=>[id,[]]));
  if(!serviceIds.length)return byService;
  const db=createAdminSupabaseClient();
  const {data,error}=await db.from("staff").select("id,name,staff_services!staff_services_salon_id_staff_id_fkey!inner(service_id)")
    .eq("salon_id",salonId).eq("active",true).eq("staff_services.salon_id",salonId).in("staff_services.service_id",serviceIds).order("name");
  if(error)throw error;
  for(const row of data??[])for(const link of row.staff_services)byService[link.service_id]?.push({id:row.id,name:row.name});
  return byService;
}

export async function getPublicStaffForService(salonId:string,serviceId:string):Promise<PublicStaff[]>{
  return(await getPublicStaffByService(salonId,[serviceId]))[serviceId]??[];
}

export async function getAvailableSlotsForDate(args:{salonSlug:string;serviceId:string;date:string;staffId?:string|null;source?:"public"|"internal"}):Promise<PublicAvailability>{
  const db=createAdminSupabaseClient();
  const salon=await getSalonBySlug(args.salonSlug);if(!salon)throw new Error("SALON_NOT_FOUND");

  const [serviceResult,settingsResult,staff]=await Promise.all([
    db.from("services")
    .select("id,salon_id,name,description,duration_minutes,price_cents,currency,buffer_minutes,active,online_bookable,category_id")
    .eq("id",args.serviceId).eq("salon_id",salon.id).eq("active",true).maybeSingle(),
    db.from("booking_settings").select("slot_interval_minutes,min_lead_minutes,max_days_ahead,allow_staff_choice").eq("salon_id",salon.id).maybeSingle(),
    getPublicStaffForService(salon.id,args.serviceId),
  ]);
  const {data:serviceData,error:serviceError}=serviceResult;
  if(serviceError)throw serviceError;if(!serviceData)throw new Error("SERVICE_NOT_FOUND");
  const service=serviceData as ServiceRow;
  if((args.source??"public")==="public"&&!service.online_bookable)throw new Error("SERVICE_NOT_FOUND");

  if(settingsResult.error)throw settingsResult.error;
  const settings=settingsResult.data??{slot_interval_minutes:15,min_lead_minutes:60,max_days_ahead:90,allow_staff_choice:true};

  const todayLocal=formatInTimeZone(new Date(),salon.timezone,"yyyy-MM-dd");
  const requestedCalendarDate=new Date(`${args.date}T12:00:00Z`);
  const todayCalendarDate=new Date(`${todayLocal}T12:00:00Z`);
  const daysAhead=differenceInCalendarDays(requestedCalendarDate,todayCalendarDate);
  if(daysAhead<0||daysAhead>settings.max_days_ahead)return{salon,staff:[],slots:[]};

  const weekday=requestedCalendarDate.getUTCDay();
  const nextCalendarDate=new Date(requestedCalendarDate.getTime()+86_400_000).toISOString().slice(0,10);
  const dayStart=fromZonedTime(`${args.date}T00:00:00`,salon.timezone);
  const dayEnd=fromZonedTime(`${nextCalendarDate}T00:00:00`,salon.timezone);

  const eligibleStaff=args.staffId?staff.filter(member=>member.id===args.staffId):staff;
  if(!eligibleStaff.length)return{salon,staff,slots:[]};
  const staffIds=eligibleStaff.map(member=>member.id);

  const [openingResult,openingExceptionResult,scheduleResult,scheduleOverrideResult,breaksResult,blocksResult,appointmentsResult]=await Promise.all([
    db.from("opening_hours").select("start_time,end_time").eq("salon_id",salon.id).eq("weekday",weekday).eq("is_open",true).maybeSingle(),
    db.from("opening_exceptions").select("is_open,start_time,end_time").eq("salon_id",salon.id).eq("exception_date",args.date).maybeSingle(),
    db.from("staff_schedules").select("staff_id,start_time,end_time").eq("salon_id",salon.id).eq("weekday",weekday).eq("is_working",true).in("staff_id",staffIds),
    db.from("staff_schedule_overrides").select("staff_id,is_working,start_time,end_time").eq("salon_id",salon.id).eq("override_date",args.date).in("staff_id",staffIds),
    db.from("breaks").select("staff_id,start_time,end_time").eq("salon_id",salon.id).eq("weekday",weekday).eq("active",true).in("staff_id",staffIds),
    db.from("blocks").select("staff_id,starts_at,ends_at").eq("salon_id",salon.id).lt("starts_at",dayEnd.toISOString()).gt("ends_at",dayStart.toISOString()),
    db.from("appointments").select("staff_id,starts_at,occupied_until").eq("salon_id",salon.id).in("staff_id",staffIds).in("status",["pending","confirmed","checked_in"]).lt("starts_at",dayEnd.toISOString()).gt("occupied_until",dayStart.toISOString()),
  ]);
  for(const result of[openingResult,openingExceptionResult,scheduleResult,scheduleOverrideResult,breaksResult,blocksResult,appointmentsResult])if(result.error)throw result.error;

  const exception=openingExceptionResult.data;
  const effectiveOpening=exception?(exception.is_open&&exception.start_time&&exception.end_time?exception:null):openingResult.data;
  if(!effectiveOpening)return{salon,staff,slots:[]};

  const salonWindow=asLocalInterval(args.date,salon.timezone,effectiveOpening as TimeRow);
  const minStart=(args.source??"public")==="public"?new Date(Date.now()+settings.min_lead_minutes*60_000):new Date();

  const availability=computeAvailability({
    serviceDurationMinutes:service.duration_minutes,
    bufferMinutes:service.buffer_minutes,
    slotIntervalMinutes:settings.slot_interval_minutes,
    minStart,
    staff:eligibleStaff.map(member=>{
      const override=(scheduleOverrideResult.data??[]).find(row=>row.staff_id===member.id);
      const weekly=(scheduleResult.data??[]).find(row=>row.staff_id===member.id);
      const effectiveSchedule=override?(override.is_working&&override.start_time&&override.end_time?override:null):weekly;
      const staffBreaks=(breaksResult.data??[]).filter(row=>row.staff_id===member.id);
      const staffBlocks=(blocksResult.data??[]).filter(row=>row.staff_id===null||row.staff_id===member.id);
      const staffAppointments=(appointmentsResult.data??[]).filter(row=>row.staff_id===member.id) as AppointmentRow[];
      return{staffId:member.id,salonOpen:[salonWindow],staffWorking:effectiveSchedule?[asLocalInterval(args.date,salon.timezone,effectiveSchedule as TimeRow)]:[],breaks:staffBreaks.map(row=>asLocalInterval(args.date,salon.timezone,row as TimeRow)),blocks:staffBlocks.map(row=>isoInterval(row as TimedRow)),appointments:staffAppointments.map(row=>({start:new Date(row.starts_at),end:new Date(row.occupied_until)}))};
    }),
  });

  return{salon,staff,slots:availability.map(slot=>({start:slot.start.toISOString(),serviceEnd:slot.serviceEnd.toISOString(),staffIds:slot.staffIds}))};
}

export async function createPublicBooking(args:{salonSlug:string;serviceId:string;staffId?:string|null;startsAt:string;customer:{name:string;phone:string;email:string;note?:string|null}}){
  const salon=await getSalonBySlug(args.salonSlug);if(!salon)throw new Error("SALON_NOT_FOUND");
  const startsAt=new Date(args.startsAt);if(Number.isNaN(startsAt.getTime()))throw new Error("INVALID_START_TIME");
  const date=formatInTimeZone(startsAt,salon.timezone,"yyyy-MM-dd");
  const current=await getAvailableSlotsForDate({salonSlug:args.salonSlug,serviceId:args.serviceId,date,staffId:args.staffId,source:"public"});
  const exact=current.slots.find(slot=>slot.start===startsAt.toISOString());if(!exact)throw new Error("SLOT_UNAVAILABLE");
  const candidates=args.staffId?[args.staffId]:exact.staffIds;if(!candidates.length)throw new Error("SLOT_UNAVAILABLE");

  const db=createAdminSupabaseClient();let lastConflict=false;
  for(const candidateStaffId of candidates){
    const {data,error}=await db.rpc("create_appointment_atomic",{p_salon_id:salon.id,p_service_id:args.serviceId,p_staff_id:candidateStaffId,p_starts_at:startsAt.toISOString(),p_customer_name:args.customer.name,p_customer_phone:args.customer.phone,p_customer_email:args.customer.email,p_note:args.customer.note??null,p_source:"public_booking",p_created_by:null});
    if(!error)return{appointmentId:data as string,staffId:candidateStaffId};
    const retryable=error.code==="23P01"||error.message.includes("SLOT_JUST_BOOKED")||error.message.includes("TIME_BLOCKED")||error.message.includes("STAFF_BREAK")||error.message.includes("STAFF_NOT_WORKING");
    if(!args.staffId&&retryable){lastConflict=true;continue}
    if(error.code==="23P01"||error.message.includes("SLOT_JUST_BOOKED"))throw new Error("SLOT_JUST_BOOKED");
    throw error;
  }
  if(lastConflict)throw new Error("SLOT_JUST_BOOKED");
  throw new Error("SLOT_UNAVAILABLE");
}
