import { formatMoney } from "@/lib/format";

export function TodaySummary({ appointmentCount, plannedValueCents, occupancyPercent, bookableMinutes, currency, staffRole }: {
  appointmentCount: number;
  plannedValueCents: number;
  occupancyPercent: number;
  bookableMinutes: number;
  freeCapacityMinutes: number;
  attentionCount: number;
  currency: string;
  staffRole: boolean;
}) {
  return <section aria-label="Vandaag samengevat" className="flex flex-wrap items-baseline gap-x-5 gap-y-2 py-4 text-sm text-[var(--muted)]">
    <p><strong className="font-semibold text-[var(--ink)] tabular-nums">{appointmentCount}</strong> afspraken</p>
    {!staffRole ? <p><strong className="font-semibold text-[var(--ink)] tabular-nums">{formatMoney(plannedValueCents, currency)}</strong> geplande waarde</p> : null}
    {bookableMinutes > 0 ? <p><strong className="font-semibold text-[var(--ink)] tabular-nums">{occupancyPercent}%</strong> bezet</p> : null}
  </section>;
}
