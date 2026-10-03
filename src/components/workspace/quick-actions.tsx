import Link from "next/link";
import { WorkspaceIcon } from "@/components/ui/workspace-icon";

export function QuickActions({ canManage }: { canManage: boolean }) {
  if (!canManage) return null;
  const actions = [
    { label: "+ Afspraak", href: "/app/calendar/new", icon: "calendar" as const, primary: true },
    { label: "Blokkeer tijd", href: "/app/blocks", icon: "blocks" as const, primary: false },
    { label: "Deel tijden", href: "/app/booking-links", icon: "calendar" as const, primary: false },
    { label: "Klant toevoegen", href: "/app/customers", icon: "customers" as const, primary: false },
  ];
  return <div className="flex flex-wrap gap-2" aria-label="Snelle acties">
    {actions.map(action=><Link key={action.href} href={action.href} className={`inline-flex min-h-11 items-center gap-2 rounded-[10px] border px-4 text-sm font-medium transition active:scale-[.985] ${action.primary ? "border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)]" : "border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--surface-soft)]"}`}>
      <WorkspaceIcon name={action.icon} size={16}/>{action.label}
    </Link>)}
  </div>;
}
