"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "owner" | "manager" | "staff";

export function AppNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const primary = role === "staff"
    ? [["Today", "/app/today"], ["Calendar", "/app/calendar"], ["More", "/app/more"]] as const
    : [["Today", "/app/today"], ["Calendar", "/app/calendar"], ["Customers", "/app/customers"], ["More", "/app/more"]] as const;
  const secondary = role === "owner" || role === "manager"
    ? [["Services", "/app/services"], ["Staff", "/app/staff"], ["Blocks", "/app/blocks"], ["Reports", "/app/reports"], ["Settings", "/app/settings"]] as const
    : [["Settings", "/app/settings"]] as const;

  const routeIsActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreIsActive = routeIsActive("/app/more") || secondary.some(([, href]) => routeIsActive(href));

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--line)] bg-[var(--surface)] px-5 py-6 md:flex md:flex-col">
        <Link href="/app/today" className="flex items-center gap-3 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink)] text-[11px] font-semibold tracking-[0.08em] text-white">
            S
          </span>
          <span>
            <span className="block text-[15px] font-semibold tracking-[-0.03em]">SALON</span>
            <span className="mt-0.5 block text-[11px] text-[var(--muted)]">Workspace</span>
          </span>
        </Link>

        <nav className="mt-10 grid gap-1" aria-label="Hoofdnavigatie">
          {primary.map(([label, href]) => {
            const active = href === "/app/more" ? moreIsActive : routeIsActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`group flex min-h-11 items-center justify-between rounded-[14px] px-3.5 text-sm font-medium transition-colors ${active ? "bg-[var(--ink)] text-white" : "text-[#4d4b47] hover:bg-white"}`}
              >
                <span>{label}</span>
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full transition-colors ${active ? "bg-[var(--accent-light)]" : "bg-transparent group-hover:bg-[var(--subtle)]"}`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="my-5 h-px bg-[var(--line)]" />

        <nav className="grid gap-1" aria-label="Beheer">
          {secondary.map(([label, href]) => {
            const active = routeIsActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-10 items-center rounded-[12px] px-3.5 text-sm transition-colors ${active ? "bg-white font-medium text-[var(--ink)]" : "text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <p className="mt-auto px-2 text-[11px] leading-5 text-[var(--muted)]">
          Rust in je planning.
        </p>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(env(safe-area-inset-bottom),12px)] md:hidden" aria-label="Mobiele navigatie">
        <div className={`grid ${primary.length === 3 ? "grid-cols-3" : "grid-cols-4"} rounded-[24px] border border-[var(--line)] bg-white/96 p-1.5 shadow-[0_18px_48px_rgba(17,17,17,0.14)] backdrop-blur-xl`}>
          {primary.map(([label, href]) => {
            const active = href === "/app/more" ? moreIsActive : routeIsActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-[11px] font-medium transition-colors ${active ? "bg-[var(--ink)] text-white" : "text-[var(--muted)]"}`}
              >
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[var(--accent-light)]" : "bg-[var(--surface-2)]"}`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
