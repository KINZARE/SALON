import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getBlocks, getStaff } from "@/services/app-data";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { createBlock, deleteBlock } from "./actions";

const selectClassName =
  "min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-3.5 text-[15px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(177,95,44,0.10)]";

export default async function BlocksPage() {
  const { salon, membership } = await requireAppContext();

  if (membership.role === "staff") {
    return (
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.045em]">Geen toegang</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Blocks worden beheerd door owner of manager.</p>
      </div>
    );
  }

  const [blocks, staff] = await Promise.all([getBlocks(salon.id, new Date().toISOString()), getStaff(salon.id)]);
  const staffMap = new Map(staff.map((member) => [member.id, member.name]));
  const nowLocal = formatInTimeZone(new Date(), salon.timezone, "yyyy-MM-dd'T'HH:mm");

  return (
    <>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Beschikbaarheid</p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.055em]">Blocks</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Vakantie, privéafspraken, administratie of momenten waarop de salon dicht is.</p>
      </header>

      <section className="mt-9">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <h2 className="text-sm font-medium">Toekomstige blocks</h2>
          <p className="text-xs text-[var(--muted)]">{blocks.length} totaal</p>
        </div>

        {!blocks.length ? (
          <div className="mt-5">
            <EmptyState title="Geen toekomstige blocks" description="Je normale beschikbaarheid is op dit moment niet extra geblokkeerd." />
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {blocks.map((block) => (
              <div key={block.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <p className="font-semibold tracking-[-0.02em]">{block.staff_id ? staffMap.get(block.staff_id) ?? "Medewerker" : "Hele salon"}</p>
                  <p className="mt-1 break-words text-sm leading-6 text-[var(--muted)]">
                    {formatInTimeZone(new Date(block.starts_at), salon.timezone, "dd-MM-yyyy HH:mm")} –{" "}
                    {formatInTimeZone(new Date(block.ends_at), salon.timezone, "dd-MM-yyyy HH:mm")}
                    {block.reason ? ` · ${block.reason}` : ""}
                  </p>
                </div>
                <form action={deleteBlock}>
                  <input type="hidden" name="id" value={block.id} />
                  <button className="min-h-10 rounded-[var(--radius-pill)] px-3 text-xs font-medium text-[var(--danger)] hover:bg-[#fff7f5]">Verwijderen</button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 max-w-2xl rounded-[var(--radius-card)] bg-[var(--surface)] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Nieuw</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Tijd blokkeren</h2>
        <form action={createBlock} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            <span>Voor wie?</span>
            <select name="staffId" className={selectClassName}>
              <option value="">Hele salon</option>
              {staff.filter((member) => member.active).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Van" name="startsAt" type="datetime-local" defaultValue={nowLocal} required />
            <Field label="Tot" name="endsAt" type="datetime-local" required />
          </div>
          <Field label="Reden (optioneel)" name="reason" maxLength={160} placeholder="Bijv. vakantie" />
          <div><Button>Block toevoegen</Button></div>
        </form>
      </section>
    </>
  );
}
