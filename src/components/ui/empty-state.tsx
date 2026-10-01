import Link from "next/link";

export function EmptyState({ title, description, action, href }: { title: string; description: string; action?: string; href?: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center border-y border-[var(--border)] px-5 py-10 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-[var(--muted)]">{description}</p>
      {action && href ? <Link href={href} className="mt-5 rounded-[11px] bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white">{action}</Link> : null}
    </div>
  );
}
