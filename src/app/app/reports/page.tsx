import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { formatMoney } from "@/lib/format";

export default async function ReportsPage() {
  const { salon, membership } = await requireAppContext();
  if (membership.role === "staff") return <div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Rapportage is alleen beschikbaar voor owner en manager.</p></div>;
  const db = createAdminSupabaseClient();
  const month = formatInTimeZone(new Date(), salon.timezone, "yyyy-MM");
  const [year, monthNumber] = month.split("-").map(Number);
  const nextMonthYear = monthNumber === 12 ? year + 1 : year;
  const nextMonthNumber = monthNumber === 12 ? 1 : monthNumber + 1;
  const from = fromZonedTime(`${month}-01T00:00:00`, salon.timezone);
  const until = fromZonedTime(`${nextMonthYear}-${String(nextMonthNumber).padStart(2,"0")}-01T00:00:00`, salon.timezone);
  const { data, error } = await db.from("appointments").select("status,price_cents_snapshot").eq("salon_id",salon.id).gte("starts_at",from.toISOString()).lt("starts_at",until.toISOString());
  if (error) throw error;
  const rows = data ?? [];
  const completed = rows.filter((item) => item.status === "completed");
  const revenue = completed.reduce((sum,item) => sum + item.price_cents_snapshot, 0);
  const average = completed.length ? Math.round(revenue / completed.length) : 0;
  const metrics=[
    [formatMoney(revenue,salon.currency),"omzet afgerond"],
    [String(rows.length),"afspraken"],
    [formatMoney(average,salon.currency),"gem. afspraak"],
    [String(rows.filter(item=>item.status==="cancelled").length),"annuleringen"],
    [String(rows.filter(item=>item.status==="no_show").length),"no-shows"],
  ];
  return <div data-reports-workspace>
    <header><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Reports</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Deze maand</h1><p className="mt-1 text-sm text-[var(--muted)]">Een klein operationeel overzicht — geen BI-dashboard.</p></header>
    <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">{metrics.map(([value,label])=><div key={label} className="rounded-[20px] border border-[var(--border)] bg-white p-4 sm:p-5"><p className="text-xl font-semibold tracking-[-.04em] sm:text-2xl">{value}</p><p className="mt-1 text-xs text-[var(--muted)]">{label}</p></div>)}</div>
    <p className="mt-5 max-w-2xl text-xs leading-5 text-[var(--muted)]">Omzet telt alleen afspraken met status afgerond. Dit scherm blijft bewust secundair aan Today en Calendar.</p>
  </div>;
}
