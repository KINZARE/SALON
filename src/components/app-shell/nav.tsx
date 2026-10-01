"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "owner" | "manager" | "staff";

const glyphs: Record<string, string> = {
  Today: "T",
  Calendar: "C",
  Customers: "K",
  Services: "B",
  Staff: "M",
  Blocks: "V",
  Reports: "R",
  Settings: "I",
  More: "••",
};

export function AppNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const primary = role === "staff"
    ? [["Today", "/app/today"], ["Calendar", "/app/calendar"], ["More", "/app/more"]] as const
    : [["Today", "/app/today"], ["Calendar", "/app/calendar"], ["Customers", "/app/customers"]] as const;
  const secondary = role === "staff"
    ? [["Settings", "/app/settings"]] as const
    : [["Services","/app/services"],["Staff","/app/staff"],["Blocks","/app/blocks"],["Reports","/app/reports"],["Settings","/app/settings"]] as const;

  const navLink = ([label, href]: readonly [string, string]) => {
    const active = pathname.startsWith(href);
    return <Link key={href} href={href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[#4f5f78] hover:bg-[#f4f7fb] hover:text-[var(--foreground)]"}`}>
      <span aria-hidden className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border text-[11px] font-bold tracking-[-0.02em] ${active ? "border-[#c9dcff] bg-white text-[var(--primary)]" : "border-transparent bg-[#f5f7fb] text-[#75839a] group-hover:border-[var(--border)] group-hover:bg-white"}`}>{glyphs[label] ?? label.slice(0,1)}</span>
      <span>{label}</span>
    </Link>;
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] border-r border-[var(--border)] bg-white md:flex md:flex-col">
        <div className="flex h-[74px] items-center border-b border-[var(--border)] px-6">
          <Link href="/app/today" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-[var(--primary)] text-sm font-bold text-white shadow-sm">S</span>
            <span className="text-[17px] font-semibold tracking-[0.24em] text-[#17376f]">SALON</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a0aaba]">Workspace</p>
          <div className="grid gap-1">{primary.map(navLink)}</div>
          <div className="my-5 border-t border-[var(--border)]" />
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a0aaba]">Beheer</p>
          <div className="grid gap-1">{secondary.map(navLink)}</div>
        </nav>
        <div className="border-t border-[var(--border)] p-4">
          <div className="rounded-2xl bg-[#f7f9fd] p-4">
            <p className="text-xs font-semibold text-[#274472]">SALON workspace</p>
            <p className="mt-1 text-[11px] leading-5 text-[var(--muted)]">Planning, klanten en team op één plek.</p>
          </div>
        </div>
      </aside>

      <nav className={`fixed inset-x-0 bottom-0 z-50 grid ${primary.length === 3 ? "grid-cols-3" : "grid-cols-4"} border-t border-[var(--border)] bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 shadow-[0_-6px_24px_rgba(15,23,42,.04)] backdrop-blur md:hidden`}>
        {primary.map(([label, href]) => {
          const active = pathname.startsWith(href);
          return <Link key={href} href={href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[10px] text-[11px] font-medium ${active ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}>
            <span aria-hidden className="text-[10px] font-bold">{glyphs[label] ?? label.slice(0,1)}</span>{label}
          </Link>;
        })}
        {primary.length === 3 ? <Link href="/app/more" className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-[10px] text-[11px] font-medium text-[var(--muted)]"><span aria-hidden className="text-xs font-bold">••</span>More</Link> : null}
      </nav>
    </>
  );
}
