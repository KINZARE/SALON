export type NotificationKind = "booking_confirmation" | "appointment_reminder";

type NotificationInput = {
  kind: NotificationKind;
  salonName: string;
  customerName: string;
  serviceName: string;
  startsAt: string;
  timezone: string;
};

export function buildNotificationMessage(input: NotificationInput) {
  const date = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: input.timezone,
  }).format(new Date(input.startsAt));
  const time = new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: input.timezone,
  }).format(new Date(input.startsAt));

  if (input.kind === "appointment_reminder") {
    return {
      subject: `Herinnering voor je afspraak bij ${input.salonName}`,
      text: [
        `Hoi ${input.customerName},`,
        "",
        `Dit is een herinnering voor je afspraak bij ${input.salonName}.`,
        `${input.serviceName} · ${date} om ${time}`,
        "",
        "Tot snel!",
      ].join("\n"),
    };
  }

  return {
    subject: `Je afspraak bij ${input.salonName} is bevestigd`,
    text: [
      `Hoi ${input.customerName},`,
      "",
      `Je afspraak bij ${input.salonName} is bevestigd.`,
      `${input.serviceName} · ${date} om ${time}`,
      "",
      "Tot snel!",
    ].join("\n"),
  };
}

export function retryDelayMinutes(attemptCount: number) {
  if (attemptCount <= 1) return 5;
  if (attemptCount === 2) return 15;
  if (attemptCount === 3) return 60;
  return 240;
}
