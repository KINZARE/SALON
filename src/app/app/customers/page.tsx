import Link from "next/link";
import { requireAppContext } from "@/lib/auth";
import { getCustomers } from "@/services/app-data";
import { EmptyState } from "@/components/ui/empty-state";

export default async function CustomersPage() {
  const { salon, membership } = await requireAppContext();
  if (membership.role === "staff") return <p>Geen toegang.</p>;
  const customers = await getCustomers(salon.id);
  return <><header><h1 className="text-3xl font-semibold tracking-[-0.04em]">Customers</h1><p className="mt-1 text-sm text-[var(--muted)]">Klanten en contactgegevens.</p></header>
    <div className="mt-7">{!customers.length ? <EmptyState title="Nog geen klanten" description="Klanten worden automatisch aangemaakt wanneer een afspraak wordt geboekt." /> : <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">{customers.map((c)=><Link href={`/app/customers/${c.id}`} key={c.id} className="block py-4"><p className="font-semibold">{c.name}</p><p className="mt-1 text-sm text-[var(--muted)]">{[c.phone,c.email].filter(Boolean).join(" · ") || "Geen contactgegevens"}</p></Link>)}</div>}</div></>;
}
