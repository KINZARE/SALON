import "server-only";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getAppointmentsForDate(salonId: string, timezone: string, date?: string) {
  const localDate = date ?? formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
  const supabase = createAdminSupabaseClient();
  const calendar = new Date(`${localDate}T12:00:00Z`);
  const nextDate = new Date(calendar.getTime() + 86_400_000).toISOString().slice(0, 10);
  const start = fromZonedTime(`${localDate}T00:00:00`, timezone);
  const end = fromZonedTime(`${nextDate}T00:00:00`, timezone);
  const { data, error } = await supabase
    .from("appointments")
    .select("id,starts_at,service_ends_at,occupied_until,status,payment_status,customer_name_snapshot,service_name_snapshot,price_cents_snapshot,currency_snapshot,duration_minutes_snapshot,customer_id,staff_id,service_id,note")
    .eq("salon_id", salonId).gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()).order("starts_at");
  if (error) throw error;
  const rows = data ?? [];
  const customerIds = [...new Set(rows.map((row) => row.customer_id))];
  const staffIds = [...new Set(rows.map((row) => row.staff_id))];
  const [customersResult, staffResult] = await Promise.all([
    customerIds.length ? supabase.from("customers").select("id,name").in("id", customerIds) : Promise.resolve({ data: [], error: null }),
    staffIds.length ? supabase.from("staff").select("id,name").in("id", staffIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (customersResult.error) throw customersResult.error;
  if (staffResult.error) throw staffResult.error;
  const customers = new Map((customersResult.data ?? []).map((row) => [row.id, row]));
  const staff = new Map((staffResult.data ?? []).map((row) => [row.id, row]));
  return rows.map((row) => ({ ...row, customer: customers.get(row.customer_id) ?? null, staff: staff.get(row.staff_id) ?? null }));
}

export async function getCustomers(salonId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("customers").select("id,name,phone,email,created_at").eq("salon_id", salonId).order("name").limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function getServices(salonId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("services").select("id,name,duration_minutes,price_cents,currency,active,online_bookable").eq("salon_id", salonId).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getStaff(salonId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("staff").select("id,name,active").eq("salon_id", salonId).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getBlocks(salonId: string, fromIso: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("blocks").select("id,staff_id,starts_at,ends_at,reason").eq("salon_id", salonId).gte("ends_at", fromIso).order("starts_at").limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function getBookingSettings(salonId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("booking_settings").select("slot_interval_minutes,min_lead_minutes,max_days_ahead,allow_staff_choice,cancellation_hours").eq("salon_id", salonId).single();
  if (error) throw error;
  return data;
}

export async function getOpeningHours(salonId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("opening_hours").select("weekday,is_open,start_time,end_time").eq("salon_id", salonId).order("weekday");
  if (error) throw error;
  return data ?? [];
}

export async function getSalonProfile(salonId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.from("salons").select("id,name,slug,phone,email,address,timezone,currency").eq("id", salonId).single();
  if (error) throw error;
  return data;
}
