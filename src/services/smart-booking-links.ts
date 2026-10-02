import "server-only";

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { validateBookingLinkWindow, isDateWithinBookingLink } from "@/domain/booking-link";
import { generateSecureToken, hashSecureToken, isSecureTokenActive } from "@/domain/secure-token";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createPublicBooking, getAvailableSlotsForDate, getPublicStaffForService } from "@/services/public-booking";

export async function createSmartBookingLink(salonId:string,args:{serviceId:string;staffId?:string|null;startDate:string;endDate:string}) {
  const {startDate,endDate}=validateBookingLinkWindow(args.startDate,args.endDate);
  const db=createAdminSupabaseClient();
  const [salonResult,serviceResult,settingsResult]=await Promise.all([
    db.from("salons").select("id,slug,timezone").eq("id",salonId).maybeSingle(),
    db.from("services").select("id,name,active,online_bookable").eq("id",args.serviceId).eq("salon_id",salonId).maybeSingle(),
    db.from("booking_settings").select("max_days_ahead").eq("salon_id",salonId).maybeSingle(),
  ]);
  if(salonResult.error)throw salonResult.error;
  if(serviceResult.error)throw serviceResult.error;
  if(settingsResult.error)throw settingsResult.error;
  if(!salonResult.data||!serviceResult.data?.active||!serviceResult.data.online_bookable)throw new Error("SERVICE_NOT_BOOKABLE");

  const today=formatInTimeZone(new Date(),salonResult.data.timezone,"yyyy-MM-dd");
  if(startDate<today)throw new Error("BOOKING_LINK_IN_PAST");
  const maxDate=new Date(`${today}T12:00:00Z`);
  maxDate.setUTCDate(maxDate.getUTCDate()+(settingsResult.data?.max_days_ahead??90));
  if(endDate>maxDate.toISOString().slice(0,10))throw new Error("BOOKING_LINK_OUTSIDE_WINDOW");

  if(args.staffId){
    const eligible=await getPublicStaffForService(salonId,args.serviceId);
    if(!eligible.some(member=>member.id===args.staffId))throw new Error("STAFF_NOT_ELIGIBLE");
  }

  const token=generateSecureToken();
  const tokenHash=hashSecureToken(token);
  const expiresAt=fromZonedTime(`${endDate}T23:59:59`,salonResult.data.timezone).toISOString();
  const {data,error}=await db.from("smart_booking_links").insert({
    salon_id:salonId,
    service_id:args.serviceId,
    staff_id:args.staffId||null,
    token_hash:tokenHash,
    starts_on:startDate,
    ends_on:endDate,
    expires_at:expiresAt,
    active:true,
  }).select("id").single();
  if(error)throw error;
  return {id:data.id,token,expiresAt};
}

export async function getSmartBookingLinkContext(rawToken:string){
  if(!rawToken||rawToken.length<40)return null;
  const db=createAdminSupabaseClient();
  const tokenHash=hashSecureToken(rawToken);
  const {data:link,error}=await db.from("smart_booking_links")
    .select("id,salon_id,service_id,staff_id,starts_on,ends_on,expires_at,active")
    .eq("token_hash",tokenHash).maybeSingle();
  if(error)throw error;
  if(!link||!link.active||!isSecureTokenActive({expiresAt:link.expires_at,revokedAt:null}))return null;

  const [salonResult,serviceResult,staff]=await Promise.all([
    db.from("salons").select("id,slug,name,timezone,currency").eq("id",link.salon_id).maybeSingle(),
    db.from("services").select("id,name,description,duration_minutes,price_cents,currency,active,online_bookable").eq("id",link.service_id).eq("salon_id",link.salon_id).maybeSingle(),
    getPublicStaffForService(link.salon_id,link.service_id),
  ]);
  if(salonResult.error)throw salonResult.error;
  if(serviceResult.error)throw serviceResult.error;
  if(!salonResult.data||!serviceResult.data?.active||!serviceResult.data.online_bookable)return null;
  if(link.staff_id&&!staff.some(member=>member.id===link.staff_id))return null;

  return {
    tokenHash,
    link,
    salon:salonResult.data,
    service:{
      id:serviceResult.data.id,
      name:serviceResult.data.name,
      description:serviceResult.data.description,
      durationMinutes:serviceResult.data.duration_minutes,
      priceCents:serviceResult.data.price_cents,
      currency:serviceResult.data.currency,
    },
    staff,
  };
}

export async function getSmartBookingLinkAvailability(rawToken:string,date:string){
  const context=await getSmartBookingLinkContext(rawToken);
  if(!context||!isDateWithinBookingLink(date,context.link.starts_on,context.link.ends_on))throw new Error("SMART_LINK_UNAVAILABLE");
  return getAvailableSlotsForDate({
    salonSlug:context.salon.slug,
    serviceId:context.service.id,
    date,
    staffId:context.link.staff_id,
    source:"public",
  });
}

export async function bookSmartBookingLink(rawToken:string,args:{staffId?:string|null;startsAt:string;customer:{name:string;phone:string;email:string;note?:string|null}}){
  const context=await getSmartBookingLinkContext(rawToken);
  if(!context)throw new Error("SMART_LINK_UNAVAILABLE");
  const startsAt=new Date(args.startsAt);
  if(Number.isNaN(startsAt.getTime()))throw new Error("INVALID_START_TIME");
  const date=formatInTimeZone(startsAt,context.salon.timezone,"yyyy-MM-dd");
  if(!isDateWithinBookingLink(date,context.link.starts_on,context.link.ends_on))throw new Error("SMART_LINK_DATE_REJECTED");
  const staffId=context.link.staff_id??args.staffId??null;
  if(staffId&&!context.staff.some(member=>member.id===staffId))throw new Error("STAFF_NOT_ELIGIBLE");
  return createPublicBooking({
    salonSlug:context.salon.slug,
    serviceId:context.service.id,
    staffId,
    startsAt:startsAt.toISOString(),
    customer:args.customer,
  });
}
