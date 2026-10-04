import { z } from "zod";

// Preserve SALON's existing UUID v1–v5 contract, including the RFC variant.
export const UuidSchema = z.uuid().refine(value => Number(value[14]) >= 1 && Number(value[14]) <= 5);
export const IsoDateSchema = z.iso.date();
export const InstantSchema = z.iso.datetime({ offset: true });
export const TimeSchema = z.iso.time({ precision: -1 });
export const EmailSchema = z.email({ pattern: /^\S+@\S+\.\S+$/ });
export const OptionalUuidSchema = UuidSchema.nullish().or(z.literal("")).transform(value => value || null);
const optionalText = (max: number) => z.unknown().optional().transform(value => typeof value === "string" ? value.trim().slice(0, max) || null : null);
const name = z.string().trim().min(1).max(160);
const publicCustomer = z.object({
  name: optionalText(160).pipe(z.string().min(1)),
  phone: optionalText(40).pipe(z.string().refine(value => value.replace(/\D/g, "").length >= 6)),
  email: optionalText(254).pipe(EmailSchema),
  note: optionalText(1000),
});
export const CustomerSchema = z.object({ name: optionalText(160).pipe(z.string().min(1)), phone: optionalText(40), email: optionalText(254).pipe(EmailSchema.nullable()), note: optionalText(1000) });
// Profile editing keeps its existing 60-character phone and free-text email contract.
export const CustomerProfileSchema = z.object({ id: UuidSchema, name, phone: z.string().max(60), email: z.string().max(254), notes: z.string().max(3000) });
export const PublicBookingSchema = z.object({ serviceId: UuidSchema, staffId: OptionalUuidSchema, startsAt: InstantSchema, customer: publicCustomer });
export const AppointmentInputSchema = PublicBookingSchema.extend({ staffId: UuidSchema, customerId: OptionalUuidSchema, customer: CustomerSchema });
export const RescheduleInputSchema = z.object({ appointmentId: UuidSchema, staffId: UuidSchema, startsAt: InstantSchema });
const optionalString = z.unknown().optional().transform(value => typeof value === "string" ? value : null);
export const CalendarMoveSchema = z.object({ appointmentId: UuidSchema, staffId: UuidSchema, localStart: optionalString.transform(value => value ?? ""), expectedStartsAt: optionalString, expectedStaffId: optionalString });
export const SelfServiceRescheduleSchema = RescheduleInputSchema.omit({ appointmentId: true });
export const WaitlistSchema = z.object({
  serviceId: UuidSchema, staffId: OptionalUuidSchema, date: IsoDateSchema,
  customer: z.object({ name, phone: optionalText(40), email: optionalText(254) }).refine(value => Boolean(value.phone || value.email)),
});
export const BookingLinkSchema = z.object({ serviceId: UuidSchema, staffId: OptionalUuidSchema, startDate: IsoDateSchema, endDate: IsoDateSchema });
export const BookingLinkBookingSchema = PublicBookingSchema.omit({ serviceId: true });
export const MoneyInputSchema = z.string().transform(value => Number(value.trim().replace(",", "."))).pipe(z.number().finite().nonnegative()).transform(value => Math.round(value * 100));
export const ServiceSchema = z.object({
  id: OptionalUuidSchema, name: z.string().trim().min(1).max(120), categoryId: OptionalUuidSchema,
  duration: z.number().int().min(5).max(720), buffer: z.number().int().min(0).max(180),
  priceCents: z.number().int().nonnegative(), depositCents: z.number().int().nonnegative().nullable(),
  staffIds: z.array(UuidSchema), paymentMode: z.enum(["pay_in_salon", "none", "deposit", "full_payment"]),
});
export const CategorySchema = z.object({ id: OptionalUuidSchema, name: z.string().trim().min(1).max(80), sortOrder: z.number().int().min(0).max(10000) });
export const StaffSchema = z.object({ id: OptionalUuidSchema, name: z.string().trim().min(1).max(120), email: z.string().max(254), role: z.enum(["owner", "manager", "staff"]), serviceIds: z.array(UuidSchema).min(1) });
export const OpeningExceptionSchema = z.object({ date: IsoDateSchema, isOpen: z.boolean(), start: TimeSchema.nullable(), end: TimeSchema.nullable() }).refine(value => !value.isOpen || Boolean(value.start && value.end));
export const StaffScheduleOverrideSchema = z.object({ staffId: UuidSchema, date: IsoDateSchema, isWorking: z.boolean(), start: TimeSchema.nullable(), end: TimeSchema.nullable() }).refine(value => !value.isWorking || Boolean(value.start && value.end));
export const ReportRangeSchema = z.object({ preset: z.enum(["this_week", "this_month", "previous_month", "last30", "custom"]), today: IsoDateSchema, from: IsoDateSchema.optional(), to: IsoDateSchema.optional() });
