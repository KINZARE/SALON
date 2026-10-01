import Link from "next/link";
import { requireAppContext } from "@/lib/auth";

export default async function MorePage(){
  const { membership } = await requireAppContext();
  const items = membership.role === "staff"
    ? [["Settings","Account en voorkeuren","/app/settings"]] as const
    : [["Services","Behandelingen, duur en prijs","/app/services"],["Staff","Medewerkers en beschikbaarheid","/app/staff"],["Blocks","Vrije tijd, vakantie en sluitingen","/app/blocks"],["Reports","Operationele rapportage","/app/reports"],["Settings","Salon, booking en account","/app/settings"]] as const;
  return <><h1 className="text-3xl font-semibold tracking-[-0.04em]">More</h1><div className="mt-7 divide-y divide-[var(--border)] border-y border-[var(--border)]">{items.map(([title,desc,href])=><Link key={href} href={href} className="block py-4"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-[var(--muted)]">{desc}</p></Link>)}</div></>;
}
