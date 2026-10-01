import Link from "next/link";

export function EmptyState({
  title,
  description,
  action,
  href,
}: {
  title: string;
  description: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-[var(--radius-card-sm)] bg-[var(--surface)] px-6 py-12 text-center">
      <span className="mb-5 h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
      <h2 className="text-[17px] font-semibold tracking-[-0.025em]">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">{description}</p>
      {action && href ? (
        <Link
          href={href}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--ink)] px-5 text-sm font-medium text-white transition-transform active:scale-[0.985]"
        >
          {action}
        </Link>
      ) : null}
    </div>
  );
}
