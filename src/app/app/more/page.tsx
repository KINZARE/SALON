import Link from "next/link";
import { requireAppContext } from "@/lib/auth";
import { WorkspaceIcon, type WorkspaceIconName } from "@/components/ui/workspace-icon";

type MoreItem = readonly [string, string, string, WorkspaceIconName];
type MoreSection = readonly [string, readonly MoreItem[]];

export default async function MorePage(){
  const { membership } = await requireAppContext();

  const sections: readonly MoreSection[] = membership.role === "staff"
    ? [
        ["Account", [
          ["Instellingen", "Account en voorkeuren", "/app/settings", "settings"],
        ]],
      ]
    : [
        ["Boekingen & klanten", [
          ["Booking links", "Deel alleen relevante live beschikbare tijden", "/app/booking-links", "calendar"],
          ["Wachtlijst", "Volg klanten op wanneer er een plek vrijkomt", "/app/waitlist", "customers"],
          ["Intake", "Formulieren en toestemming per behandeling", "/app/intake", "services"],
        ]],
        ["Planning", [
          ["Afwijkende roosters", "Feestdagen, vrije dagen en extra shifts", "/app/settings/schedule", "calendar"],
          ["Tijd blokkeren", "Blokkeer pauzes, sluitingen en andere tijd", "/app/blocks", "blocks"],
        ]],
        ["Online boeken", [
          ["Booking widget", "Plaats online boeken op je eigen website", "/app/settings/widget", "settings"],
        ]],
        ["Beheer", [
          ["Behandelingen", "Behandelingen, duur, prijs en categorieën", "/app/services", "services"],
          ["Team", "Medewerkers, roosters en pauzes", "/app/staff", "staff"],
          ["Rapporten", "Omzet, afspraken en operationele inzichten", "/app/reports", "reports"],
          ["Instellingen", "Salonprofiel, openingstijden en boekingsregels", "/app/settings", "settings"],
        ]],
      ];

  return (
    <div data-more-workspace>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[var(--accent)]">Meer</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-[36px]">Meer opties</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Alles wat je minder vaak nodig hebt, logisch gegroepeerd buiten je dagelijkse navigatie.</p>
      </header>

      <div className="mt-7 grid gap-7">
        {sections.map(([sectionTitle, items]) => (
          <section key={sectionTitle}>
            <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--subtle)]">{sectionTitle}</h2>
            <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-white">
              {items.map(([title, desc, href, icon], index) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex min-h-[76px] items-center gap-4 px-4 py-4 hover:bg-[var(--surface-soft)] sm:px-5 ${index ? "border-t border-[var(--border)]" : ""}`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[var(--surface-soft)] text-[var(--muted)]">
                    <WorkspaceIcon name={icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{title}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">{desc}</p>
                  </div>
                  <span className="text-[var(--muted)]">→</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
