import "server-only";
import { formatInTimeZone } from "date-fns-tz";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAvailableSlotsForDate } from "@/services/public-booking";

export async function createInternalBooking(args: {
  salon: { id: string; slug: string; timezone: string };
  userId: string | null;
  serviceId: string;
  staffId: string;
  startsAt: string;
  customer: { id?: string | null; name: string; phone?: string | null; email?: string | null; note?: string | null };
}) {
  const startsAt = new Date(args.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw new Error("INVALID_START_TIME");
  const date = formatInTimeZone(startsAt, args.salon.timezone, "yyyy-MM-dd");
  const availability = await getAvailableSlotsForDate({ salonSlug: args.salon.slug, serviceId: args.serviceId, staffId: args.staffId, date, source: "internal" });
  if (!availability.slots.some((slot) => slot.start === startsAt.toISOString())) throw new Error("SLOT_UNAVAILABLE");

  const db = createAdminSupabaseClient();
  const { data, error } = await db.rpc("create_appointment_atomic", {
    p_salon_id: args.salon.id, p_service_id: args.serviceId, p_staff_id: args.staffId, p_starts_at: startsAt.toISOString(),
    p_customer_name: args.customer.name, p_customer_phone: args.customer.phone ?? null, p_customer_email: args.customer.email ?? null,
    p_note: args.customer.note ?? null, p_source: "internal", p_created_by: args.userId ?? null, p_customer_id: args.customer.id ?? null,
  });
  if (error) {
    if (error.message.includes("SLOT_JUST_BOOKED") || error.code === "23P01") throw new Error("SLOT_JUST_BOOKED");
    throw error;
  }
  return data as string;
}
