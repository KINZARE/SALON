import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { isPreviewDemoMode } from "@/lib/preview-mode";

export default async function ReportsPage() {
  const { salon, membership } = await requireAppContext();
  if (membership.role === "staff") return <div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Rapportage is alleen beschikbaar voor owner en manager.</p></div>;
  let rows: Array<{ status: string; price_cents_snapshot: number }>;
  if (isPreviewDemoMode()) {
    rows = [
      { status: "completed", price_cents_snapshot: 6500 },
      { status: "completed", price_cents_snapshot: 7000 },
      { status: "completed", price_cents_snapshot: 6500 },
      { status: "confirmed", price_cents_snapshot: 3900 },
      { status: "cancelled", price_cents_snapshot: 6500 },
      { status: "no_show", price_cents_snapshot: 7000 },
    ];
  } else {
    const db = await createUserSupabaseClient();
    const month = formatInTimeZone(new Date(), salon.timezone, "yyyy-MM");
    const [year, monthNumber] = month.split("-").map(Number);
    const nextMonthYear = monthNumber === 12 ? year + 1 : year;
    const nextMonthNumber = monthNumber === 12 ? 1 : monthNumber + 1;
    const from = fromZonedTime(`${month}-01T00:00:00`, salon.timezone);
    const until = fromZonedTime(`${nextMonthYear}-${String(nextMonthNumber).padStart(2,"0")}-01T00:00:00`, salon.timezone);
    const { data, error } = await db.from("appointments").select("status,price_cents_snapshot").eq("salon_id",salon.id).gte("starts_at",from.toISOString()).lt("starts_at",until.toISOString());
    if (error) throw error;
    rows = data ?? [];
  }
  const completed = rows.filter((item) => item.status === "completed");
  const revenue = completed.reduce((sum,item) => sum + item.price_cents_snapshot, 0);
  const average = completed.length ? Math.round(revenue / completed.length) : 0;
  return <><h1 className="text-3xl font-semibold tracking-[-0.04em]">Reports</h1><p className="mt-1 text-sm text-[var(--muted)]">Deze maand · operationeel overzicht</p><div className="mt-7 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-[var(--border)] py-6 sm:grid-cols-5"><div><p className="text-2xl font-semibold">{formatMoney(revenue,salon.currency)}</p><p className="mt-1 text-xs text-[var(--muted)]">omzet completed</p></div><div><p className="text-2xl font-semibold">{rows.length}</p><p className="mt-1 text-xs text-[var(--muted)]">afspraken</p></div><div><p className="text-2xl font-semibold">{formatMoney(average,salon.currency)}</p><p className="mt-1 text-xs text-[var(--muted)]">gem. completed</p></div><div><p className="text-2xl font-semibold">{rows.filter((item)=>item.status==="cancelled").length}</p><p className="mt-1 text-xs text-[var(--muted)]">annuleringen</p></div><div><p className="text-2xl font-semibold">{rows.filter((item)=>item.status==="no_show").length}</p><p className="mt-1 text-xs text-[var(--muted)]">no-shows</p></div></div></>;
}
