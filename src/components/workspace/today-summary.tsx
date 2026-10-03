import { formatMoney } from "@/lib/format";

export function TodaySummary({ appointmentCount, plannedRevenueCents, completedCount, workingStaffCount, currency, staffRole }: {
  appointmentCount: number;
  plannedRevenueCents: number;
  completedCount: number;
  workingStaffCount: number;
  currency: string;
  staffRole: boolean;
}) {
  const items = [
    { label: "afspraken", value: String(appointmentCount) },
    { label: staffRole ? "afgerond" : "gepland", value: staffRole ? String(completedCount) : formatMoney(plannedRevenueCents, currency) },
    { label: "team vandaag", value: String(workingStaffCount) },
  ];
  return <section aria-label="Vandaag samengevat" className="grid grid-cols-3 overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">
    {items.map((item,index)=><div key={item.label} className={`min-w-0 px-4 py-4 sm:px-6 ${index ? "border-l border-[var(--border)]" : ""}`}>
      <p className="truncate text-xl font-semibold tracking-[-.04em] text-[var(--ink)] tabular-nums sm:text-2xl">{item.value}</p>
      <p className="mt-1 text-[11px] text-[var(--muted)] sm:text-xs">{item.label}</p>
    </div>)}
  </section>;
}
