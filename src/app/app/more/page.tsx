import Link from "next/link";
import { requireAppContext } from "@/lib/auth";
import { WorkspaceIcon, type WorkspaceIconName } from "@/components/ui/workspace-icon";

type MoreItem = readonly [string, string, string, WorkspaceIconName];
type MoreSection = readonly [string, readonly MoreItem[]];

export default async function MorePage(){
  const { membership } = await requireAppContext();

  const sections: readonly MoreSection[] = membership.role === "staff"
    ? [["Account", [["Instellingen", "Account en voorkeuren", "/app/settings", "settings"]]]]
    : [
        ["Salon", [
          ["Behandelingen", "Wat kunnen klanten boeken?", "/app/services", "services"],
          ["Team", "Wie werkt hier?", "/app/staff", "staff"],
          ["Openingstijden", "Wanneer zijn we open?", "/app/settings#opening-hours", "calendar"],
        ]],
        ["Boekingen", [
          ["Booking links", "Deel beschikbare tijden", "/app/booking-links", "calendar"],
          ["Wachtlijst", "Vul een vrijgekomen plek", "/app/waitlist", "customers"],
          ["Intake", "Formulieren en toestemming", "/app/intake", "services"],
          ["Booking widget", "Boeken op je eigen website", "/app/settings/widget", "settings"],
          ["Afwijkende roosters", "Vrije dagen en extra shifts", "/app/settings/schedule", "calendar"],
          ["Tijd blokkeren", "Reserveer tijd zonder afspraak", "/app/blocks", "blocks"],
        ]],
        ["Inzicht", [["Rapporten", "Hoe gaat het met de salon?", "/app/reports", "reports"]]],
        ["Instellingen", [["Saloninstellingen", "Profiel en boekingsregels", "/app/settings", "settings"]]],
      ];

  return <div data-more-workspace>
    <header><p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--primary)]">Meer</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Meer</h1></header>
    <div className="mt-7 grid gap-7">
      {sections.map(([sectionTitle,items])=><section key={sectionTitle}>
        <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--subtle)]">{sectionTitle}</h2>
        <div className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-white">
          {items.map(([title,desc,href,icon],index)=><Link key={href} href={href} className={`flex min-h-[72px] items-center gap-4 px-4 py-4 transition-colors hover:bg-[var(--surface-soft)] sm:px-5 ${index?"border-t border-[var(--border)]":""}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] text-[var(--muted)]"><WorkspaceIcon name={icon}/></span>
            <div className="min-w-0 flex-1"><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-[var(--muted)]">{desc}</p></div>
            <span className="text-[var(--muted)]">→</span>
          </Link>)}
        </div>
      </section>)}
    </div>
  </div>;
}
