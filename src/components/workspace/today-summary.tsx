import { formatMoney } from "@/lib/format";

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  if (!remainder) return `${hours}u`;
  return `${hours}u ${remainder}m`;
}

export function TodaySummary({ appointmentCount, plannedValueCents, occupancyPercent, bookableMinutes, freeCapacityMinutes, attentionCount, currency, staffRole }: {
  appointmentCount: number;
  plannedValueCents: number;
  occupancyPercent: number;
  bookableMinutes: number;
  freeCapacityMinutes: number;
  attentionCount: number;
  currency: string;
  staffRole: boolean;
}) {
  const occupiedMinutes = Math.max(0, bookableMinutes - freeCapacityMinutes);
  const items = [
    { label: "Afspraken", value: String(appointmentCount), context: "niet geannuleerd" },
    ...(!staffRole ? [{ label: "Geplande waarde", value: formatMoney(plannedValueCents, currency), context: "afspraakwaarde vandaag" }] : []),
    { label: "Bezetting", value: `${occupancyPercent}%`, context: `${formatMinutes(occupiedMinutes)} van ${formatMinutes(bookableMinutes)} boekbaar` },
    { label: "Vrije capaciteit", value: formatMinutes(freeCapacityMinutes), context: "na pauzes en blokkades" },
    { label: "Aandacht nodig", value: String(attentionCount), context: attentionCount ? "bekijk de aandachtspunten" : "geen open punten" },
  ];

  return <section aria-label="Vandaag samengevat" className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--border)]">
    <div className={`grid gap-px ${staffRole ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 lg:grid-cols-5"}`}>
      {items.map((item,index)=><div key={item.label} className={`min-w-0 bg-white px-4 py-4 sm:px-5 ${items.length % 2 === 1 && index === items.length - 1 ? "col-span-2 lg:col-span-1" : ""}`}>
        <p className="text-[11px] font-medium text-[var(--muted)] sm:text-xs">{item.label}</p>
        <p className="mt-2 truncate text-xl font-semibold tracking-[-.04em] text-[var(--ink)] tabular-nums sm:text-2xl">{item.value}</p>
        <p className="mt-1 text-[10px] leading-4 text-[var(--muted)] sm:text-[11px]">{item.context}</p>
      </div>)}
    </div>
  </section>;
}
