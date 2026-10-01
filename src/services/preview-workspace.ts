import "server-only";
import { cookies } from "next/headers";
import { formatInTimeZone } from "date-fns-tz";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { PREVIEW_DEMO, getDemoAppointmentsForDate, getDemoBlocks } from "@/demo/preview-data";

export type PreviewCustomer = { id: string; name: string; phone: string | null; email: string | null; internal_notes: string | null; created_at: string };
export type PreviewService = { id: string; name: string; description: string | null; duration_minutes: number; buffer_minutes: number; price_cents: number; currency: string; active: boolean; online_bookable: boolean; staff_ids: string[] };
export type PreviewSchedule = { weekday: number; is_working: boolean; start_time: string | null; end_time: string | null };
export type PreviewBreak = { weekday: number; start_time: string; end_time: string };
export type PreviewStaff = { id: string; name: string; email: string | null; operational_role: "owner" | "manager" | "staff"; active: boolean; service_ids: string[]; schedules: PreviewSchedule[]; breaks: PreviewBreak[] };
export type PreviewAppointment = {
  id: string; starts_at: string; service_ends_at: string; occupied_until: string; status: string; payment_status: string;
  customer_name_snapshot: string; service_name_snapshot: string; price_cents_snapshot: number; currency_snapshot: string;
  duration_minutes_snapshot: number; buffer_minutes_snapshot: number; customer_id: string; staff_id: string; service_id: string; note: string | null;
};
export type PreviewBlock = { id: string; staff_id: string | null; starts_at: string; ends_at: string; reason: string | null };
export type PreviewWorkspaceState = {
  salon: typeof PREVIEW_DEMO.salon;
  customers: PreviewCustomer[];
  services: PreviewService[];
  staff: PreviewStaff[];
  appointments: PreviewAppointment[];
  blocks: PreviewBlock[];
  bookingSettings: typeof PREVIEW_DEMO.bookingSettings;
  openingHours: Array<{ weekday: number; is_open: boolean; start_time: string | null; end_time: string | null }>;
};
export type VersionedPreviewWorkspaceState = PreviewWorkspaceState & { version: number };

function initialState(): PreviewWorkspaceState {
  const localDate = formatInTimeZone(new Date(), PREVIEW_DEMO.salon.timezone, "yyyy-MM-dd");
  const serviceIds = PREVIEW_DEMO.services.map((service) => service.id);
  const opening = PREVIEW_DEMO.openingHours.map((row) => ({ ...row }));
  const staff: PreviewStaff[] = PREVIEW_DEMO.staff.map((member, index) => ({
    ...member,
    email: index === 0 ? "nok@baanthai-demo.nl" : "mali@baanthai-demo.nl",
    operational_role: index === 0 ? "owner" : "staff",
    service_ids: [...serviceIds],
    schedules: opening.map((row) => ({ weekday: row.weekday, is_working: row.is_open, start_time: row.is_open ? row.start_time : null, end_time: row.is_open ? row.end_time : null })),
    breaks: index === 0 ? [{ weekday: 3, start_time: "13:00", end_time: "13:30" }] : [],
  }));
  const services: PreviewService[] = PREVIEW_DEMO.services.map((service) => ({
    id: service.id, name: service.name, description: service.description, duration_minutes: service.duration_minutes,
    buffer_minutes: service.buffer_minutes, price_cents: service.price_cents, currency: service.currency,
    active: service.active, online_bookable: service.online_bookable, staff_ids: [...PREVIEW_DEMO.staff.map((member) => member.id)],
  }));
  const appointments: PreviewAppointment[] = getDemoAppointmentsForDate(localDate).map((appointment) => {
    const service = PREVIEW_DEMO.services.find((item) => item.name === appointment.service_name_snapshot) ?? PREVIEW_DEMO.services[0];
    return {
      id: appointment.id, starts_at: appointment.starts_at, service_ends_at: appointment.service_ends_at,
      occupied_until: appointment.occupied_until, status: appointment.status, payment_status: appointment.payment_status,
      customer_name_snapshot: appointment.customer_name_snapshot, service_name_snapshot: appointment.service_name_snapshot,
      price_cents_snapshot: appointment.price_cents_snapshot, currency_snapshot: appointment.currency_snapshot,
      duration_minutes_snapshot: service.duration_minutes, buffer_minutes_snapshot: service.buffer_minutes,
      customer_id: appointment.customer_id, staff_id: appointment.staff_id, service_id: service.id, note: appointment.note,
    };
  });
  return {
    salon: { ...PREVIEW_DEMO.salon },
    customers: PREVIEW_DEMO.customers.map((customer) => ({ ...customer })),
    services, staff, appointments,
    blocks: getDemoBlocks().map((block) => ({ ...block })),
    bookingSettings: { ...PREVIEW_DEMO.bookingSettings },
    openingHours: opening,
  };
}

async function sessionId() {
  const value = (await cookies()).get("salon-preview-session")?.value;
  if (!value) throw new Error("PREVIEW_SESSION_MISSING");
  return value;
}

export async function readPreviewWorkspace(): Promise<VersionedPreviewWorkspaceState> {
  const db = createAdminSupabaseClient();
  const { data, error } = await db.rpc("workspace_preview_read", { p_session: await sessionId(), p_initial: initialState() });
  if (error) throw error;
  return data as VersionedPreviewWorkspaceState;
}

export async function mutatePreviewWorkspace<T>(mutate: (state: PreviewWorkspaceState) => T): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = await readPreviewWorkspace();
    const { version, ...plain } = current;
    const state = structuredClone(plain) as PreviewWorkspaceState;
    const result = mutate(state);
    const db = createAdminSupabaseClient();
    const write = await db.rpc("workspace_preview_write", { p_session: await sessionId(), p_version: version, p_state: state });
    if (write.error) throw write.error;
    if (write.data === true) return result;
  }
  throw new Error("PREVIEW_WRITE_CONFLICT");
}

const asText = (value: unknown) => typeof value === "string" ? value : "";
const asBool = (value: unknown) => value === true;
const asNumber = (value: unknown) => typeof value === "number" ? value : Number(value);
const textArray = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export async function savePreviewEntity(kind: string, payload: Record<string, unknown>): Promise<string> {
  return mutatePreviewWorkspace((state) => {
    const requestedId = asText(payload.id);
    if (kind === "customer") {
      const id = requestedId || crypto.randomUUID();
      const existing = state.customers.find((item) => item.id === id);
      const customer: PreviewCustomer = {
        id, name: asText(payload.name).trim(), phone: asText(payload.phone) || null, email: asText(payload.email) || null,
        internal_notes: asText(payload.internal_notes) || null, created_at: existing?.created_at ?? new Date().toISOString(),
      };
      if (existing) Object.assign(existing, customer); else state.customers.push(customer);
      return id;
    }
    if (kind === "service") {
      const id = requestedId || crypto.randomUUID();
      const existing = state.services.find((item) => item.id === id);
      const service: PreviewService = {
        id, name: asText(payload.name).trim(), description: asText(payload.description) || null,
        duration_minutes: asNumber(payload.duration_minutes), buffer_minutes: asNumber(payload.buffer_minutes),
        price_cents: asNumber(payload.price_cents), currency: state.salon.currency, active: asBool(payload.active),
        online_bookable: asBool(payload.online_bookable), staff_ids: textArray(payload.staff_ids),
      };
      if (existing) Object.assign(existing, service); else state.services.push(service);
      for (const member of state.staff) {
        member.service_ids = service.staff_ids.includes(member.id)
          ? [...new Set([...member.service_ids, id])]
          : member.service_ids.filter((serviceId) => serviceId !== id);
      }
      return id;
    }
    if (kind === "staff") {
      const id = requestedId || crypto.randomUUID();
      const existing = state.staff.find((item) => item.id === id);
      const role = asText(payload.role);
      const member: PreviewStaff = {
        id, name: asText(payload.name).trim(), email: asText(payload.email) || null,
        operational_role: role === "owner" || role === "manager" ? role : "staff", active: asBool(payload.active),
        service_ids: textArray(payload.service_ids),
        schedules: Array.isArray(payload.schedules) ? payload.schedules as PreviewSchedule[] : [],
        breaks: Array.isArray(payload.breaks) ? payload.breaks as PreviewBreak[] : [],
      };
      if (existing) Object.assign(existing, member); else state.staff.push(member);
      for (const service of state.services) {
        service.staff_ids = member.service_ids.includes(service.id)
          ? [...new Set([...service.staff_ids, id])]
          : service.staff_ids.filter((staffId) => staffId !== id);
      }
      return id;
    }
    if (kind === "block") {
      const startsAt = new Date(asText(payload.starts_at));
      const endsAt = new Date(asText(payload.ends_at));
      const staffId = asText(payload.staff_id) || null;
      const conflict = state.appointments.some((appointment) =>
        ["pending","confirmed","checked_in"].includes(appointment.status)
        && (!staffId || appointment.staff_id === staffId)
        && new Date(appointment.starts_at) < endsAt && startsAt < new Date(appointment.occupied_until));
      if (conflict) throw new Error("APPOINTMENTS_IN_BLOCK");
      const id = crypto.randomUUID();
      state.blocks.push({ id, staff_id: staffId, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), reason: asText(payload.reason) || null });
      return id;
    }
    if (kind === "deleteBlock") {
      const index = state.blocks.findIndex((item) => item.id === requestedId);
      if (index < 0) throw new Error("NOT_FOUND");
      state.blocks.splice(index, 1);
      return requestedId;
    }
    if (kind === "status") {
      const appointment = state.appointments.find((item) => item.id === requestedId);
      if (!appointment) throw new Error("NOT_FOUND");
      appointment.status = asText(payload.status);
      return requestedId;
    }
    if (kind === "note") {
      const appointment = state.appointments.find((item) => item.id === requestedId);
      if (!appointment) throw new Error("NOT_FOUND");
      appointment.note = asText(payload.note) || null;
      return requestedId;
    }
    if (kind === "settings") {
      const salon = payload.salon as Record<string, unknown>;
      const settings = payload.settings as Record<string, unknown>;
      state.salon = { ...state.salon, name: asText(salon.name).trim(), phone: asText(salon.phone), email: asText(salon.email), address: asText(salon.address) };
      state.bookingSettings = {
        slot_interval_minutes: asNumber(settings.slot_interval_minutes), min_lead_minutes: asNumber(settings.min_lead_minutes),
        max_days_ahead: asNumber(settings.max_days_ahead), allow_staff_choice: asBool(settings.allow_staff_choice),
        cancellation_hours: asNumber(settings.cancellation_hours),
      };
      state.openingHours = Array.isArray(payload.openingHours) ? payload.openingHours as PreviewWorkspaceState["openingHours"] : state.openingHours;
      return state.salon.id;
    }
    throw new Error("INVALID_INPUT");
  });
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
}

export async function movePreviewAppointment(args: { id: string; staffId: string; startsAt: string; expectedStartsAt?: string | null; expectedStaffId?: string | null }) {
  return mutatePreviewWorkspace((state) => {
    const appointment = state.appointments.find((item) => item.id === args.id);
    if (!appointment) throw new Error("NOT_FOUND");
    if (args.expectedStartsAt && appointment.starts_at !== args.expectedStartsAt) throw new Error("STALE_APPOINTMENT");
    if (args.expectedStaffId && appointment.staff_id !== args.expectedStaffId) throw new Error("STALE_APPOINTMENT");
    const member = state.staff.find((item) => item.id === args.staffId && item.active && item.service_ids.includes(appointment.service_id));
    if (!member) throw new Error("SLOT_UNAVAILABLE");

    const start = new Date(args.startsAt);
    const serviceEnd = new Date(start.getTime() + appointment.duration_minutes_snapshot * 60_000);
    const occupiedUntil = new Date(serviceEnd.getTime() + appointment.buffer_minutes_snapshot * 60_000);
    const localDate = formatInTimeZone(start, state.salon.timezone, "yyyy-MM-dd");
    const endDate = formatInTimeZone(occupiedUntil, state.salon.timezone, "yyyy-MM-dd");
    if (localDate !== endDate) throw new Error("SLOT_UNAVAILABLE");
    const weekday = new Date(localDate + "T12:00:00Z").getUTCDay();
    const startTime = formatInTimeZone(start, state.salon.timezone, "HH:mm");
    const endTime = formatInTimeZone(occupiedUntil, state.salon.timezone, "HH:mm");
    const open = state.openingHours.find((row) => row.weekday === weekday && row.is_open);
    const work = member.schedules.find((row) => row.weekday === weekday && row.is_working);
    if (!open?.start_time || !open.end_time || !work?.start_time || !work.end_time || startTime < open.start_time.slice(0,5) || endTime > open.end_time.slice(0,5) || startTime < work.start_time.slice(0,5) || endTime > work.end_time.slice(0,5)) throw new Error("SLOT_UNAVAILABLE");
    if (member.breaks.some((row) => row.weekday === weekday && startTime < row.end_time.slice(0,5) && row.start_time.slice(0,5) < endTime)) throw new Error("SLOT_UNAVAILABLE");
    if (state.blocks.some((block) => (!block.staff_id || block.staff_id === member.id) && overlaps(start, occupiedUntil, new Date(block.starts_at), new Date(block.ends_at)))) throw new Error("SLOT_UNAVAILABLE");
    if (state.appointments.some((other) => other.id !== appointment.id && other.staff_id === member.id && ["pending","confirmed","checked_in"].includes(other.status) && overlaps(start, occupiedUntil, new Date(other.starts_at), new Date(other.occupied_until)))) throw new Error("SLOT_JUST_BOOKED");

    appointment.staff_id = member.id;
    appointment.starts_at = start.toISOString();
    appointment.service_ends_at = serviceEnd.toISOString();
    appointment.occupied_until = occupiedUntil.toISOString();
    return appointment.id;
  });
}

export async function createPreviewBooking(args: { serviceId: string; staffId: string; startsAt: string; customer: { id?: string | null; name: string; phone?: string | null; email?: string | null; note?: string | null } }) {
  return mutatePreviewWorkspace((state) => {
    const service = state.services.find((item) => item.id === args.serviceId && item.active);
    const staff = state.staff.find((item) => item.id === args.staffId && item.active && item.service_ids.includes(args.serviceId));
    if (!service || !staff) throw new Error("SLOT_UNAVAILABLE");
    let customer = args.customer.id ? state.customers.find((item) => item.id === args.customer.id) : undefined;
    if (!customer) {
      customer = { id: crypto.randomUUID(), name: args.customer.name, phone: args.customer.phone ?? null, email: args.customer.email ?? null, internal_notes: null, created_at: new Date().toISOString() };
      state.customers.push(customer);
    }
    const start = new Date(args.startsAt);
    const serviceEnd = new Date(start.getTime() + service.duration_minutes * 60_000);
    const occupiedUntil = new Date(serviceEnd.getTime() + service.buffer_minutes * 60_000);
    if (state.appointments.some((other) => other.staff_id === staff.id && ["pending","confirmed","checked_in"].includes(other.status) && overlaps(start, occupiedUntil, new Date(other.starts_at), new Date(other.occupied_until)))) throw new Error("SLOT_JUST_BOOKED");
    const id = crypto.randomUUID();
    state.appointments.push({
      id, starts_at: start.toISOString(), service_ends_at: serviceEnd.toISOString(), occupied_until: occupiedUntil.toISOString(),
      status: "confirmed", payment_status: "unpaid", customer_name_snapshot: customer.name, service_name_snapshot: service.name,
      price_cents_snapshot: service.price_cents, currency_snapshot: service.currency, duration_minutes_snapshot: service.duration_minutes,
      buffer_minutes_snapshot: service.buffer_minutes, customer_id: customer.id, staff_id: staff.id, service_id: service.id, note: args.customer.note ?? null,
    });
    return id;
  });
}
