export const appointmentStatuses = [
  "pending",
  "confirmed",
  "checked_in",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type AppointmentStatus = (typeof appointmentStatuses)[number];

const transitions: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["checked_in", "cancelled", "no_show"],
  checked_in: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function canTransitionAppointment(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  return transitions[from].includes(to);
}

export function assertAppointmentTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
): void {
  if (!canTransitionAppointment(from, to)) {
    throw new Error(`Invalid appointment transition: ${from} -> ${to}`);
  }
}
