import Link from "next/link";
import { requireAppContext } from "@/lib/auth";
import { WorkspaceIcon, type WorkspaceIconName } from "@/components/ui/workspace-icon";

export default async function MorePage(){
  const { membership } = await requireAppContext();
  const items:readonly [string,string,string,WorkspaceIconName][] = membership.role === "staff"
    ? [["Settings","Account en voorkeuren","/app/settings","settings"]]
    : [
      ["Services","Behandelingen, duur en prijs","/app/services","services"],
      ["Staff","Medewerkers, roosters en pauzes","/app/staff","staff"],
      ["Reports","Operationeel maandoverzicht","/app/reports","reports"],
      ["Settings","Salon, openingstijden en booking","/app/settings","settings"],
      ["Blocks","Komende vrije tijd en sluitingen","/app/blocks","blocks"],
    ];
  return <div data-more-workspace>
    <header><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Meer</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Beheer</h1><p className="mt-1 text-sm text-[var(--muted)]">Minder gebruikte instellingen en beheerfuncties, uit de dagelijkse navigatie gehouden.</p></header>
    <div className="mt-7 overflow-hidden rounded-[24px] border border-[var(--border)] bg-white">{items.map(([title,desc,href,icon],index)=><Link key={href} href={href} className={`flex min-h-[76px] items-center gap-4 px-4 py-4 hover:bg-[var(--surface-soft)] sm:px-5 ${index?"border-t border-[var(--border)]":""}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[var(--surface-soft)] text-[var(--muted)]"><WorkspaceIcon name={icon}/></span><div className="min-w-0 flex-1"><p className="font-semibold">{title}</p><p className="mt-1 truncate text-sm text-[var(--muted)]">{desc}</p></div><span className="text-[var(--muted)]">→</span></Link>)}</div>
  </div>;
}
