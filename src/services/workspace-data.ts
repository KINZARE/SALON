import "server-only";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { isMissingSchemaFeatureError } from "@/lib/supabase/schema-compat";

export async function getTodayStaffSchedule(salonId: string, weekday: number, date: string) {
  const db = createAdminSupabaseClient();
  const { data, error } = await db.from("staff")
    .select("id,name,active,schedules:staff_schedules!staff_schedules_salon_id_staff_id_fkey(weekday,is_working,start_time,end_time),breaks:breaks!breaks_salon_id_staff_id_fkey(weekday,start_time,end_time),overrides:staff_schedule_overrides!staff_schedule_overrides_salon_id_staff_id_fkey(is_working,start_time,end_time)")
    .eq("salon_id", salonId).eq("active", true)
    .eq("schedules.weekday", weekday).eq("breaks.weekday", weekday).eq("breaks.active", true)
    .eq("overrides.override_date", date).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getWorkspaceServices(salonId: string) {
  const db = createAdminSupabaseClient();
  const linksPromise = db.from("staff_services").select("staff_id,service_id").eq("salon_id", salonId);
  const servicesResult = await db.from("services")
    .select("id,name,description,duration_minutes,buffer_minutes,price_cents,currency,active,online_bookable,payment_mode,deposit_cents,rebook_after_days")
    .eq("salon_id", salonId).order("name");
  const linksResult = await linksPromise;
  if (linksResult.error) throw linksResult.error;

  let services;
  if (servicesResult.error) {
    if (!isMissingSchemaFeatureError(servicesResult.error,["rebook_after_days"])) throw servicesResult.error;
    const legacy = await db.from("services")
      .select("id,name,description,duration_minutes,buffer_minutes,price_cents,currency,active,online_bookable,payment_mode,deposit_cents")
      .eq("salon_id", salonId).order("name");
    if (legacy.error) throw legacy.error;
    services = (legacy.data ?? []).map(service=>({...service,rebook_after_days:null}));
  } else {
    services = servicesResult.data ?? [];
  }

  return services.map((service) => ({
    ...service,
    staff_ids: (linksResult.data ?? []).filter((link) => link.service_id === service.id).map((link) => link.staff_id),
  }));
}

export async function getWorkspaceStaff(salonId: string) {
  const db = createAdminSupabaseClient();
  const [staffResult, linksResult, schedulesResult, breaksResult] = await Promise.all([
    db.from("staff").select("id,name,email,operational_role,active").eq("salon_id", salonId).order("name"),
    db.from("staff_services").select("staff_id,service_id").eq("salon_id", salonId),
    db.from("staff_schedules").select("staff_id,weekday,is_working,start_time,end_time").eq("salon_id", salonId).order("weekday"),
    db.from("breaks").select("staff_id,weekday,start_time,end_time").eq("salon_id", salonId).eq("active", true).order("weekday"),
  ]);
  for (const result of [staffResult, linksResult, schedulesResult, breaksResult]) if (result.error) throw result.error;
  return (staffResult.data ?? []).map((member) => ({
    ...member,
    service_ids: (linksResult.data ?? []).filter((link) => link.staff_id === member.id).map((link) => link.service_id),
    schedules: (schedulesResult.data ?? []).filter((row) => row.staff_id === member.id).map(({ weekday, is_working, start_time, end_time }) => ({ weekday, is_working, start_time, end_time })),
    breaks: (breaksResult.data ?? []).filter((row) => row.staff_id === member.id).map(({ weekday, start_time, end_time }) => ({ weekday, start_time, end_time })),
  }));
}

export async function searchCustomers(salonId: string, query: string) {
  const q = query.trim();
  if (q.length < 2) return [];
  const db = createAdminSupabaseClient();
  const pattern = `%${q}%`;
  const [nameResult, phoneResult, emailResult] = await Promise.all([
    db.from("customers").select("id,name,phone,email").eq("salon_id", salonId).ilike("name", pattern).limit(20),
    db.from("customers").select("id,name,phone,email").eq("salon_id", salonId).ilike("phone", pattern).limit(20),
    db.from("customers").select("id,name,phone,email").eq("salon_id", salonId).ilike("email", pattern).limit(20),
  ]);
  for (const result of [nameResult, phoneResult, emailResult]) if (result.error) throw result.error;
  const unique = new Map<string, { id: string; name: string; phone: string | null; email: string | null }>();
  for (const row of [...(nameResult.data ?? []), ...(phoneResult.data ?? []), ...(emailResult.data ?? [])]) unique.set(row.id, row);
  return [...unique.values()].slice(0, 20);
}

export async function getCustomerById(salonId: string, id: string) {
  const db = createAdminSupabaseClient();
  const { data, error } = await db.from("customers").select("id,name,phone,email").eq("salon_id", salonId).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCalendarBreaks(salonId: string, weekday: number) {
  const db = createAdminSupabaseClient();
  const { data, error } = await db.from("breaks").select("staff_id,weekday,start_time,end_time").eq("salon_id", salonId).eq("weekday", weekday).eq("active", true);
  if (error) throw error;
  return data ?? [];
}

export async function searchWorkspace(salonId: string, query: string) {
  const q = query.trim();
  if (q.length < 2) return { customers: [], staff: [], services: [], appointments: [] };
  const db = createAdminSupabaseClient();
  const pattern = `%${q}%`;
  const [customers, staff, services, appointments] = await Promise.all([
    db.from("customers").select("id,name,phone,email").eq("salon_id", salonId).ilike("name", pattern).limit(10),
    db.from("staff").select("id,name,active").eq("salon_id", salonId).ilike("name", pattern).limit(10),
    db.from("services").select("id,name,active").eq("salon_id", salonId).ilike("name", pattern).limit(10),
    db.from("appointments").select("id,customer_name_snapshot,service_name_snapshot,starts_at,status").eq("salon_id", salonId).or(`customer_name_snapshot.ilike.${pattern},service_name_snapshot.ilike.${pattern}`).order("starts_at", { ascending: false }).limit(10),
  ]);
  for (const result of [customers, staff, services, appointments]) if (result.error) throw result.error;
  return { customers: customers.data ?? [], staff: staff.data ?? [], services: services.data ?? [], appointments: appointments.data ?? [] };
}
