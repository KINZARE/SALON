"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkspaceIcon, type WorkspaceIconName } from "@/components/ui/workspace-icon";

type Role = "owner" | "manager" | "staff";
type NavItem = readonly [string, string, WorkspaceIconName];

export function AppNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const primary: readonly NavItem[] = role === "staff"
    ? [["Today", "/app/today", "today"], ["Calendar", "/app/calendar", "calendar"], ["More", "/app/more", "more"]]
    : [["Today", "/app/today", "today"], ["Calendar", "/app/calendar", "calendar"], ["Customers", "/app/customers", "customers"], ["More", "/app/more", "more"]];

  const secondary: readonly NavItem[] = role === "staff"
    ? [["Settings", "/app/settings", "settings"]]
    : [["Services", "/app/services", "services"], ["Staff", "/app/staff", "staff"], ["Reports", "/app/reports", "reports"], ["Settings", "/app/settings", "settings"]];

  const routeIsActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreIsActive = routeIsActive("/app/more") || routeIsActive("/app/blocks") || secondary.some(([, href]) => routeIsActive(href));

  const desktopLink = ([label, href, iconName]: NavItem) => {
    const active = label === "More" ? moreIsActive : routeIsActive(href);
    return (
      <Link
        key={href}
        href={href}
        className={`group flex min-h-11 items-center gap-3 rounded-[14px] px-3.5 text-sm font-medium transition-colors ${active ? "bg-[var(--ink)] text-white" : "text-[#57534d] hover:bg-white hover:text-[var(--ink)]"}`}
      >
        <span className={`grid h-8 w-8 place-items-center rounded-[11px] ${active ? "bg-white/10 text-[var(--accent-light)]" : "bg-white text-[var(--muted)] ring-1 ring-[var(--border)] group-hover:text-[var(--ink)]"}`}>
          <WorkspaceIcon name={iconName} size={17} />
        </span>
        <span>{label}</span>
        {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--accent-light)]" aria-hidden /> : null}
      </Link>
    );
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[var(--border)] bg-[var(--surface-soft)] md:flex md:flex-col">
        <div className="flex h-[74px] items-center border-b border-[var(--border)] px-5">
          <Link href="/app/today" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--ink)] text-[11px] font-semibold tracking-[.08em] text-white">S</span>
            <span>
              <span className="block text-[15px] font-semibold tracking-[-.03em]">SALON</span>
              <span className="mt-0.5 block text-[11px] text-[var(--muted)]">Workspace</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Hoofdnavigatie">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--subtle)]">Dagelijks</p>
          <div className="grid gap-1">{primary.map(desktopLink)}</div>
          <div className="my-5 border-t border-[var(--border)]" />
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-[var(--subtle)]">Beheer</p>
          <div className="grid gap-1">{secondary.map(desktopLink)}</div>
        </nav>

        <div className="border-t border-[var(--border)] p-4">
          <Link href="/app/blocks" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-xs font-medium text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]">
            <WorkspaceIcon name="blocks" size={16} />
            Tijd blokkeren
          </Link>
          <p className="mt-3 px-3 text-[11px] leading-5 text-[var(--muted)]">Rust in je planning.</p>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),10px)] md:hidden" aria-label="Mobiele navigatie">
        <div className={`grid ${primary.length === 3 ? "grid-cols-3" : "grid-cols-4"} rounded-[24px] border border-[var(--border)] bg-white/96 p-1.5 shadow-[0_18px_48px_rgba(39,32,24,.14)] backdrop-blur-xl`}>
          {primary.map(([label, href, iconName]) => {
            const active = label === "More" ? moreIsActive : routeIsActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-[11px] font-medium transition-colors ${active ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"}`}
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
