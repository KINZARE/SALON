import { formatInTimeZone } from "date-fns-tz";
import { requireAppContext } from "@/lib/auth";
import { getBlocks, getStaff } from "@/services/app-data";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { createBlock, deleteBlock } from "./actions";

export default async function BlocksPage() {
  const { salon, membership } = await requireAppContext();
  if (membership.role === "staff") return <div><h1 className="text-3xl font-semibold tracking-[-0.04em]">Geen toegang</h1><p className="mt-2 text-sm text-[var(--muted)]">Blocks worden beheerd door owner of manager.</p></div>;
  const [blocks, staff] = await Promise.all([getBlocks(salon.id, new Date().toISOString()), getStaff(salon.id)]);
  const staffMap = new Map(staff.map((member) => [member.id, member.name]));
  const nowLocal = formatInTimeZone(new Date(), salon.timezone, "yyyy-MM-dd'T'HH:mm");

  return <>
    <header><h1 className="text-3xl font-semibold tracking-[-0.04em]">Blocks</h1><p className="mt-1 text-sm text-[var(--muted)]">Vakantie, privéafspraken, administratie of salon gesloten.</p></header>
    <div className="mt-7 divide-y divide-[var(--border)] border-y border-[var(--border)]">
      {blocks.map((block) => <div key={block.id} className="flex items-start justify-between gap-4 py-4"><div><p className="font-semibold">{block.staff_id ? staffMap.get(block.staff_id) ?? "Medewerker" : "Hele salon"}</p><p className="mt-1 text-sm text-[var(--muted)]">{formatInTimeZone(new Date(block.starts_at), salon.timezone, "dd-MM-yyyy HH:mm")} – {formatInTimeZone(new Date(block.ends_at), salon.timezone, "dd-MM-yyyy HH:mm")}{block.reason ? ` · ${block.reason}` : ""}</p></div><form action={deleteBlock}><input type="hidden" name="id" value={block.id}/><button className="text-xs font-medium text-[var(--danger)]">Verwijderen</button></form></div>)}
      {!blocks.length ? <p className="py-8 text-sm text-[var(--muted)]">Geen toekomstige blocks.</p> : null}
    </div>
    <section className="mt-10 max-w-xl"><h2 className="text-lg font-semibold">Tijd blokkeren</h2><form action={createBlock} className="mt-4 grid gap-4"><label className="grid gap-1.5 text-sm font-medium"><span>Voor wie?</span><select name="staffId" className="h-11 rounded-[11px] border border-[var(--border)] bg-white px-3.5"><option value="">Hele salon</option>{staff.filter((member)=>member.active).map((member)=><option key={member.id} value={member.id}>{member.name}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><Field label="Van" name="startsAt" type="datetime-local" defaultValue={nowLocal} required/><Field label="Tot" name="endsAt" type="datetime-local" required/></div><Field label="Reden (optioneel)" name="reason" maxLength={160} placeholder="Bijv. vakantie"/><div><Button>Block toevoegen</Button></div></form></section>
  </>;
}
