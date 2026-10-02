import "server-only";

import { formatInTimeZone } from "date-fns-tz";
import { generateSecureToken, hashSecureToken, isSecureTokenActive } from "@/domain/secure-token";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAvailableSlotsForDate, getPublicStaffForService } from "@/services/public-booking";

const activeStatuses = new Set(["pending","confirmed"]);

export async function issueCustomerSelfServiceToken(salonId: string, appointmentId: string) {
  const db = createAdminSupabaseClient();
  const { data: appointment, error } = await db.from("appointments")
    .select("id,salon_id,starts_at,status")
    .eq("id",appointmentId).eq("salon_id",salonId).maybeSingle();
  if (error) throw error;
  if (!appointment || !activeStatuses.has(appointment.status) || new Date(appointment.starts_at) <= new Date()) {
    throw new Error("APPOINTMENT_NOT_SELF_SERVICE_ELIGIBLE");
  }

  const token = generateSecureToken();
  const tokenHash = hashSecureToken(token);
  const expiresAt = new Date(new Date(appointment.starts_at).getTime() + 24*60*60*1000).toISOString();
  const { error: tokenError } = await db.from("appointment_self_service_tokens").upsert({
    salon_id:salonId,
    appointment_id:appointmentId,
    token_hash:tokenHash,
    expires_at:expiresAt,
    revoked_at:null,
    updated_at:new Date().toISOString(),
  },{onConflict:"appointment_id"});
  if (tokenError) throw tokenError;
  return { token, expiresAt };
}

export async function getCustomerSelfServiceContext(rawToken: string) {
  if (!rawToken || rawToken.length < 40) return null;
  const db = createAdminSupabaseClient();
  const tokenHash = hashSecureToken(rawToken);
  const { data: token, error: tokenError } = await db.from("appointment_self_service_tokens")
    .select("id,salon_id,appointment_id,expires_at,revoked_at")
    .eq("token_hash",tokenHash).maybeSingle();
  if (tokenError) throw tokenError;
  if (!token || !isSecureTokenActive({expiresAt:token.expires_at,revokedAt:token.revoked_at})) return null;

  const [appointmentResult,salonResult,settingsResult] = await Promise.all([
    db.from("appointments").select("id,salon_id,customer_id,service_id,staff_id,starts_at,service_ends_at,status,service_name_snapshot,customer_name_snapshot,duration_minutes_snapshot,price_cents_snapshot,currency_snapshot").eq("id",token.appointment_id).eq("salon_id",token.salon_id).maybeSingle(),
    db.from("salons").select("id,slug,name,timezone,currency").eq("id",token.salon_id).maybeSingle(),
    db.from("booking_settings").select("cancellation_hours").eq("salon_id",token.salon_id).maybeSingle(),
  ]);
  if (appointmentResult.error) throw appointmentResult.error;
  if (salonResult.error) throw salonResult.error;
  if (settingsResult.error) throw settingsResult.error;
  if (!appointmentResult.data || !salonResult.data || !settingsResult.data) return null;

  const appointment = appointmentResult.data;
  const salon = salonResult.data;
  const cutoffAt = new Date(new Date(appointment.starts_at).getTime() - settingsResult.data.cancellation_hours*60*60*1000);
  const canChange = activeStatuses.has(appointment.status) && cutoffAt > new Date() && Boolean(appointment.service_id);
  const staff = appointment.service_id ? await getPublicStaffForService(salon.id,appointment.service_id) : [];

  return {
    tokenHash,
    salon,
    appointment,
    cancellationHours:settingsResult.data.cancellation_hours,
    cutoffAt:cutoffAt.toISOString(),
    canChange,
    staff,
  };
}

export async function getCustomerSelfServiceAvailability(rawToken:string,date:string,staffId?:string|null) {
  const context=await getCustomerSelfServiceContext(rawToken);
  if(!context || !context.canChange || !context.appointment.service_id) throw new Error("SELF_SERVICE_UNAVAILABLE");
  return getAvailableSlotsForDate({
    salonSlug:context.salon.slug,
    serviceId:context.appointment.service_id,
    date,
    staffId:staffId||null,
    source:"public",
  });
}

export async function rescheduleCustomerSelfService(rawToken:string,staffId:string,startsAt:string) {
  const context=await getCustomerSelfServiceContext(rawToken);
  if(!context || !context.canChange) throw new Error("SELF_SERVICE_UNAVAILABLE");
  const start=new Date(startsAt);
  if(Number.isNaN(start.getTime())) throw new Error("INVALID_START_TIME");
  const date=formatInTimeZone(start,context.salon.timezone,"yyyy-MM-dd");
  const availability=await getAvailableSlotsForDate({
    salonSlug:context.salon.slug,
    serviceId:context.appointment.service_id!,
    date,
    staffId,
    source:"public",
  });
  if(!availability.slots.some(slot=>slot.start===start.toISOString()&&slot.staffIds.includes(staffId))) throw new Error("SLOT_UNAVAILABLE");

  const db=createAdminSupabaseClient();
  const {error}=await db.rpc("self_service_reschedule_appointment",{
    p_token_hash:context.tokenHash,
    p_staff_id:staffId,
    p_starts_at:start.toISOString(),
  });
  if(error){
    if(error.code==="23P01"||error.message.includes("SLOT_JUST_BOOKED")) throw new Error("SLOT_JUST_BOOKED");
    throw error;
  }
}

export async function cancelCustomerSelfService(rawToken:string) {
  const context=await getCustomerSelfServiceContext(rawToken);
  if(!context || !context.canChange) throw new Error("SELF_SERVICE_UNAVAILABLE");
  const db=createAdminSupabaseClient();
  const {error}=await db.rpc("self_service_cancel_appointment",{p_token_hash:context.tokenHash});
  if(error) throw error;
}
