"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Role = "owner" | "manager" | "staff";

export function AppNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const primary = role === "staff"
    ? [["Today", "/app/today"], ["Calendar", "/app/calendar"], ["More", "/app/more"]] as const
    : [["Today", "/app/today"], ["Calendar", "/app/calendar"], ["Customers", "/app/customers"], ["More", "/app/more"]] as const;
  const secondary = role === "owner"
    ? [["Services","/app/services"],["Staff","/app/staff"],["Blocks","/app/blocks"],["Reports","/app/reports"],["Settings","/app/settings"]] as const
    : role === "manager"
      ? [["Services","/app/services"],["Staff","/app/staff"],["Blocks","/app/blocks"],["Reports","/app/reports"],["Settings","/app/settings"]] as const
      : [["Settings","/app/settings"]] as const;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 hidden w-56 border-r border-[var(--border)] bg-white px-4 py-5 md:block">
        <div className="px-2 text-lg font-semibold tracking-[-0.025em]">Salon</div>
        <nav className="mt-8 grid gap-1">
          {primary.map(([label, href]) => {
            const active = pathname.startsWith(href);
            return <Link key={href} href={href} className={`rounded-[10px] px-3 py-2.5 text-sm font-medium ${active ? "bg-[var(--primary-soft)] text-[var(--primary)]" : "text-[#4e4f4b] hover:bg-[#f2f2ef]"}`}>{label}</Link>;
          })}
          <div className="my-2 border-t border-[var(--border)]" />
          {secondary.map(([label,href])=><Link key={href} href={href} className="rounded-[10px] px-3 py-2.5 text-sm text-[#4e4f4b] hover:bg-[#f2f2ef]">{label}</Link>)}
        </nav>
      </aside>
      <nav className={`fixed inset-x-0 bottom-0 z-40 grid ${primary.length === 3 ? "grid-cols-3" : "grid-cols-4"} border-t border-[var(--border)] bg-white/95 px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur md:hidden`}>
        {primary.map(([label, href]) => {
          const active = pathname.startsWith(href);
          return <Link key={href} href={href} className={`flex min-h-12 items-center justify-center rounded-[10px] text-xs font-medium ${active ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}>{label}</Link>;
        })}
      </nav>
    </>
  );
}
