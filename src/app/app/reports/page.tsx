import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { isPreviewDemoMode } from "@/lib/preview-mode";

export default async function ReportsPage() {
  const { salon, membership } = await requireAppContext();

  if (membership.role === "staff") {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.045em]">Geen toegang</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Rapportage is alleen beschikbaar voor owner en manager.</p>
      </div>
    );
  }

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
    const until = fromZonedTime(
      `${nextMonthYear}-${String(nextMonthNumber).padStart(2, "0")}-01T00:00:00`,
      salon.timezone,
    );

    const { data, error } = await db
      .from("appointments")
      .select("status,price_cents_snapshot")
      .eq("salon_id", salon.id)
      .gte("starts_at", from.toISOString())
      .lt("starts_at", until.toISOString());

    if (error) throw error;
    rows = data ?? [];
  }

  const completed = rows.filter((item) => item.status === "completed");
  const revenue = completed.reduce((sum, item) => sum + item.price_cents_snapshot, 0);
  const average = completed.length ? Math.round(revenue / completed.length) : 0;
  const metrics = [
    [formatMoney(revenue, salon.currency), "omzet afgerond"],
    [String(rows.length), "afspraken"],
    [formatMoney(average, salon.currency), "gem. afgerond"],
    [String(rows.filter((item) => item.status === "cancelled").length), "annuleringen"],
    [String(rows.filter((item) => item.status === "no_show").length), "no-shows"],
  ] as const;

  return (
    <>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Deze maand</p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.055em]">Reports</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Een compact operationeel overzicht. Geen dashboard om het dashboard.</p>
      </header>

      <div className="mt-9 grid grid-cols-2 overflow-hidden rounded-[var(--radius-card-sm)] bg-[var(--surface)] sm:grid-cols-5">
        {metrics.map(([value, label], index) => (
          <div key={label} className={`min-w-0 p-5 ${index > 0 ? "border-l border-[var(--line)]" : ""} ${index > 1 ? "border-t sm:border-t-0" : ""}`}>
            <p className="truncate text-xl font-semibold tracking-[-0.04em] tabular-nums sm:text-2xl">{value}</p>
            <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">{label}</p>
          </div>
        ))}
      </div>
    </>
  );
}
