const IDS = {
  salon: "11111111-1111-4111-8111-111111111111",
  serviceThai: "22222222-2222-4222-8222-222222222222",
  serviceOil: "22222222-2222-4222-8222-222222222223",
  serviceHead: "22222222-2222-4222-8222-222222222224",
  staffNok: "33333333-3333-4333-8333-333333333333",
  staffMali: "33333333-3333-4333-8333-333333333334",
  customerSophie: "44444444-4444-4444-8444-444444444441",
  customerDaan: "44444444-4444-4444-8444-444444444442",
  customerEmma: "44444444-4444-4444-8444-444444444443",
  appointmentOne: "55555555-5555-4555-8555-555555555551",
  appointmentTwo: "55555555-5555-4555-8555-555555555552",
  appointmentThree: "55555555-5555-4555-8555-555555555553",
  bookedAppointment: "55555555-5555-4555-8555-555555555559",
  user: "66666666-6666-4666-8666-666666666666",
} as const;

export const PREVIEW_DEMO = {
  ids: IDS,
  user: { id: IDS.user, email: "preview@salon-demo.nl" },
  membership: { salonId: IDS.salon, role: "owner" as const },
  salon: {
    id: IDS.salon,
    name: "Baan Thai Wellness",
    slug: "baan-thai-demo",
    phone: "070 204 88 21",
    email: "hello@baanthai-demo.nl",
    address: "Denneweg 88, Den Haag",
    timezone: "Europe/Amsterdam",
    currency: "EUR",
    allowStaffChoice: true,
  },
  services: [
    { id: IDS.serviceThai, name: "Thai Massage 60 min", description: "Traditionele Thaise massage voor ontspanning en mobiliteit.", duration_minutes: 60, durationMinutes: 60, price_cents: 6500, priceCents: 6500, currency: "EUR", buffer_minutes: 15, active: true, online_bookable: true },
    { id: IDS.serviceOil, name: "Oil Massage 60 min", description: "Rustige oliemassage met focus op ontspanning.", duration_minutes: 60, durationMinutes: 60, price_cents: 7000, priceCents: 7000, currency: "EUR", buffer_minutes: 15, active: true, online_bookable: true },
    { id: IDS.serviceHead, name: "Head & Shoulder 30 min", description: "Korte behandeling voor nek, schouders en hoofd.", duration_minutes: 30, durationMinutes: 30, price_cents: 3900, priceCents: 3900, currency: "EUR", buffer_minutes: 10, active: true, online_bookable: true },
  ],
  staff: [
    { id: IDS.staffNok, name: "Nok", active: true },
    { id: IDS.staffMali, name: "Mali", active: true },
  ],
  customers: [
    { id: IDS.customerSophie, name: "Sophie de Vries", phone: "06 18 42 73 91", email: "sophie@example.nl", internal_notes: "Komt meestal aan het einde van de middag.", created_at: "2026-08-14T09:00:00.000Z" },
    { id: IDS.customerDaan, name: "Daan Jansen", phone: "06 24 89 11 02", email: "daan@example.nl", internal_notes: null, created_at: "2026-09-03T12:00:00.000Z" },
    { id: IDS.customerEmma, name: "Emma Bakker", phone: "06 39 54 20 17", email: "emma@example.nl", internal_notes: "Voorkeur voor Nok indien beschikbaar.", created_at: "2026-09-18T15:30:00.000Z" },
  ],
  bookingSettings: { slot_interval_minutes: 15, min_lead_minutes: 0, max_days_ahead: 90, allow_staff_choice: true, cancellation_hours: 24 },
  openingHours: [
    { weekday: 1, is_open: true, start_time: "09:30:00", end_time: "19:00:00" },
    { weekday: 2, is_open: true, start_time: "09:30:00", end_time: "19:00:00" },
    { weekday: 3, is_open: true, start_time: "09:30:00", end_time: "19:00:00" },
    { weekday: 4, is_open: true, start_time: "09:30:00", end_time: "20:00:00" },
    { weekday: 5, is_open: true, start_time: "09:30:00", end_time: "20:00:00" },
    { weekday: 6, is_open: true, start_time: "10:00:00", end_time: "18:00:00" },
    { weekday: 0, is_open: false, start_time: "10:00:00", end_time: "18:00:00" },
  ],
  bookedAppointmentId: IDS.bookedAppointment,
} as const;

const isoAt = (date: string, hour: number, minute = 0) => `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`;

export function getDemoAppointmentsForDate(date: string) {
  const [sophie, daan, emma] = PREVIEW_DEMO.customers;
  const [nok, mali] = PREVIEW_DEMO.staff;
  return [
    {
      id: IDS.appointmentOne,
      starts_at: isoAt(date, 8, 0),
      service_ends_at: isoAt(date, 9, 0),
      occupied_until: isoAt(date, 9, 15),
      status: "confirmed",
      payment_status: "pay_in_salon",
      customer_name_snapshot: sophie.name,
      service_name_snapshot: "Thai Massage 60 min",
      price_cents_snapshot: 6500,
      currency_snapshot: "EUR",
      customer_id: sophie.id,
      staff_id: nok.id,
      note: null,
      customer: { id: sophie.id, name: sophie.name, phone: sophie.phone, email: sophie.email },
      staff: { id: nok.id, name: nok.name },
    },
    {
      id: IDS.appointmentTwo,
      starts_at: isoAt(date, 10, 0),
      service_ends_at: isoAt(date, 11, 0),
      occupied_until: isoAt(date, 11, 15),
      status: "checked_in",
      payment_status: "pay_in_salon",
      customer_name_snapshot: daan.name,
      service_name_snapshot: "Oil Massage 60 min",
      price_cents_snapshot: 7000,
      currency_snapshot: "EUR",
      customer_id: daan.id,
      staff_id: mali.id,
      note: "Eerste afspraak via telefoon.",
      customer: { id: daan.id, name: daan.name, phone: daan.phone, email: daan.email },
      staff: { id: mali.id, name: mali.name },
    },
    {
      id: IDS.appointmentThree,
      starts_at: isoAt(date, 13, 30),
      service_ends_at: isoAt(date, 14, 30),
      occupied_until: isoAt(date, 14, 45),
      status: "pending",
      payment_status: "unpaid",
      customer_name_snapshot: emma.name,
      service_name_snapshot: "Thai Massage 60 min",
      price_cents_snapshot: 6500,
      currency_snapshot: "EUR",
      customer_id: emma.id,
      staff_id: nok.id,
      note: null,
      customer: { id: emma.id, name: emma.name, phone: emma.phone, email: emma.email },
      staff: { id: nok.id, name: nok.name },
    },
  ];
}

export function getDemoAppointment(id: string, date = "2026-10-01") {
  if (id === IDS.bookedAppointment) {
    const customer = PREVIEW_DEMO.customers[0];
    const staff = PREVIEW_DEMO.staff[0];
    return {
      id,
      starts_at: isoAt(date, 15, 0),
      service_ends_at: isoAt(date, 16, 0),
      occupied_until: isoAt(date, 16, 15),
      status: "confirmed",
      payment_status: "unpaid",
      customer_name_snapshot: customer.name,
      service_name_snapshot: "Thai Massage 60 min",
      price_cents_snapshot: 6500,
      currency_snapshot: "EUR",
      customer_id: customer.id,
      staff_id: staff.id,
      service_id: IDS.serviceThai,
      note: "Preview-afspraak — niet opgeslagen in een database.",
      customer: { name: customer.name, phone: customer.phone, email: customer.email },
      staff: { name: staff.name },
    };
  }
  for (const day of [date, "2026-10-01", "2026-10-02"]) {
    const found = getDemoAppointmentsForDate(day).find((item) => item.id === id);
    if (found) return { ...found, service_id: itemServiceId(found.service_name_snapshot) };
  }
  return null;
}

function itemServiceId(name: string) {
  return name === "Oil Massage 60 min" ? IDS.serviceOil : IDS.serviceThai;
}

export function getDemoCustomer(id: string) {
  return PREVIEW_DEMO.customers.find((customer) => customer.id === id) ?? null;
}

export function getDemoCustomerAppointments(customerId: string) {
  const base = [
    ...getDemoAppointmentsForDate("2026-10-01"),
    ...getDemoAppointmentsForDate("2026-09-18").map((item, index) => ({ ...item, id: `${item.id.slice(0,-1)}${7-index}`, status: index === 0 ? "completed" : item.status })),
  ];
  return base.filter((item) => item.customer_id === customerId).map(({ id, starts_at, status, service_name_snapshot, price_cents_snapshot, currency_snapshot }) => ({ id, starts_at, status, service_name_snapshot, price_cents_snapshot, currency_snapshot }));
}

export function getDemoAvailability(date: string, staffId?: string | null, durationMinutes = 60) {
  const ids = staffId ? [staffId] : PREVIEW_DEMO.staff.map((member) => member.id);
  return [8, 9.25, 11, 12.25, 14, 15.25].map((value) => {
    const hour = Math.floor(value);
    const minute = Math.round((value - hour) * 60);
    const start = isoAt(date, hour, minute);
    const serviceEndDate = new Date(new Date(start).getTime() + durationMinutes * 60_000);
    return { start, serviceEnd: serviceEndDate.toISOString(), staffIds: [...ids] };
  });
}

export function getDemoBlocks() {
  return [{ id: "77777777-7777-4777-8777-777777777771", staff_id: IDS.staffNok, starts_at: "2026-10-03T11:00:00.000Z", ends_at: "2026-10-03T12:00:00.000Z", reason: "Privé" }];
}
