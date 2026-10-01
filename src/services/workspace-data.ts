import "server-only";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { isPreviewDemoMode } from "@/lib/preview-mode";
import { readPreviewWorkspace } from "@/services/preview-workspace";

export async function getWorkspaceServices(salonId: string) {
  if (isPreviewDemoMode()) return (await readPreviewWorkspace()).services;
  const db = await createUserSupabaseClient();
  const [servicesResult, linksResult] = await Promise.all([
    db.from("services").select("id,name,description,duration_minutes,buffer_minutes,price_cents,currency,active,online_bookable").eq("salon_id", salonId).order("name"),
    db.from("staff_services").select("staff_id,service_id").eq("salon_id", salonId),
  ]);
  if (servicesResult.error) throw servicesResult.error;
  if (linksResult.error) throw linksResult.error;
  return (servicesResult.data ?? []).map((service) => ({
    ...service,
    staff_ids: (linksResult.data ?? []).filter((link) => link.service_id === service.id).map((link) => link.staff_id),
  }));
}

export async function getWorkspaceStaff(salonId: string) {
  if (isPreviewDemoMode()) return (await readPreviewWorkspace()).staff;
  const db = await createUserSupabaseClient();
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
  if (isPreviewDemoMode()) {
    const needle = q.toLowerCase();
    return (await readPreviewWorkspace()).customers
      .filter((customer) => [customer.name, customer.phone, customer.email].some((value) => value?.toLowerCase().includes(needle)))
      .slice(0, 20);
  }
  const db = await createUserSupabaseClient();
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
  if (isPreviewDemoMode()) return (await readPreviewWorkspace()).customers.find((customer) => customer.id === id) ?? null;
  const db = await createUserSupabaseClient();
  const { data, error } = await db.from("customers").select("id,name,phone,email").eq("salon_id", salonId).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCalendarBreaks(salonId: string, weekday: number) {
  if (isPreviewDemoMode()) {
    return (await readPreviewWorkspace()).staff.flatMap((member) =>
      member.breaks.filter((item) => item.weekday === weekday).map((item) => ({ ...item, staff_id: member.id })));
  }
  const db = await createUserSupabaseClient();
  const { data, error } = await db.from("breaks").select("staff_id,weekday,start_time,end_time").eq("salon_id", salonId).eq("weekday", weekday).eq("active", true);
  if (error) throw error;
  return data ?? [];
}

export async function searchWorkspace(salonId: string, query: string) {
  const q = query.trim();
  if (q.length < 2) return { customers: [], staff: [], services: [], appointments: [] };
  if (isPreviewDemoMode()) {
    const state = await readPreviewWorkspace();
    const needle = q.toLowerCase();
    return {
      customers: state.customers.filter((item) => [item.name, item.phone, item.email].some((value) => value?.toLowerCase().includes(needle))).slice(0, 10),
      staff: state.staff.filter((item) => item.name.toLowerCase().includes(needle)).slice(0, 10),
      services: state.services.filter((item) => item.name.toLowerCase().includes(needle)).slice(0, 10),
      appointments: state.appointments.filter((item) => item.customer_name_snapshot.toLowerCase().includes(needle) || item.service_name_snapshot.toLowerCase().includes(needle)).slice(0, 10),
    };
  }
  const db = await createUserSupabaseClient();
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
