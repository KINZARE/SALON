"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkspaceIcon, type WorkspaceIconName } from "@/components/ui/workspace-icon";

type Role = "owner" | "manager" | "staff";
type NavItem = readonly [string, string, WorkspaceIconName];

export function AppNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const primary: readonly NavItem[] = role === "staff"
    ? [["Vandaag", "/app/today", "today"], ["Agenda", "/app/calendar", "calendar"], ["Meer", "/app/more", "more"]]
    : [["Vandaag", "/app/today", "today"], ["Agenda", "/app/calendar", "calendar"], ["Klanten", "/app/customers", "customers"], ["Meer", "/app/more", "more"]];

  const secondary: readonly NavItem[] = role === "staff"
    ? [["Instellingen", "/app/settings", "settings"]]
    : [["Behandelingen", "/app/services", "services"], ["Team", "/app/staff", "staff"], ["Rapporten", "/app/reports", "reports"], ["Instellingen", "/app/settings", "settings"]];

  const routeIsActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreRoutes = ["/app/more", "/app/blocks", "/app/booking-links", "/app/waitlist", "/app/intake", "/app/settings/schedule", "/app/settings/widget"];
  const moreIsActive = moreRoutes.some((href) => routeIsActive(href));
  const desktopPrimary = primary.filter(([label]) => label !== "Meer");

  const desktopLink = ([label, href, iconName]: NavItem) => {
    const active = label === "Meer"
      ? moreIsActive
      : href === "/app/settings"
        ? pathname === href
        : routeIsActive(href);

    return (
      <Link
        key={href}
        href={href}
        className={`group relative flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold transition-colors ${active ? "bg-[var(--secondary-soft)] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"}`}
      >
        <span className={`grid h-8 w-8 place-items-center rounded-[8px] transition-colors ${active ? "text-[var(--accent-dark)]" : "text-[var(--muted)] group-hover:text-[var(--ink)]"}`}>
          <WorkspaceIcon name={iconName} size={17} />
        </span>
        <span>{label}</span>
        {active ? <span className="ml-auto h-4 w-1 rounded-full bg-[var(--secondary)]" aria-hidden /> : null}
      </Link>
    );
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[var(--border)] bg-white md:flex md:flex-col">
        <div className="flex h-[74px] items-center border-b border-[var(--border)] px-5">
          <Link href="/app/today" className="min-w-0">
            <span className="font-display block text-[21px] font-extrabold tracking-[-.055em] text-[var(--ink)]">ORSIRA</span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--subtle)]">Salon workspace</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Hoofdnavigatie">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--subtle)]">Dagelijks</p>
          <div className="grid gap-1">{desktopPrimary.map(desktopLink)}</div>

          <div className="my-5 border-t border-[var(--border)]" />
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--subtle)]">Beheer</p>
          <div className="grid gap-1">{secondary.map(desktopLink)}</div>

          <div className="mt-2 grid gap-1">{desktopLink(["Meer", "/app/more", "more"])}</div>
        </nav>

        <div className="border-t border-[var(--border)] p-4">
          <Link href="/app/blocks" className="flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]">
            <WorkspaceIcon name="blocks" size={16} />
            Tijd blokkeren
          </Link>
          <p className="mt-3 px-3 text-[11px] leading-5 text-[var(--subtle)]">Planning, klanten en team op één plek.</p>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),10px)] md:hidden" aria-label="Mobiele navigatie">
        <div className={`grid ${primary.length === 3 ? "grid-cols-3" : "grid-cols-4"} rounded-[16px] border border-[var(--border)] bg-white p-1.5 shadow-[0_8px_24px_rgba(23,26,23,.08)]`}>
          {primary.map(([label, href, iconName]) => {
            const active = label === "Meer" ? moreIsActive : routeIsActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[10px] px-1 text-[11px] font-semibold transition-colors ${active ? "bg-[var(--secondary-soft)] text-[var(--ink)]" : "text-[var(--muted)]"}`}
              >
                <WorkspaceIcon name={iconName} size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
