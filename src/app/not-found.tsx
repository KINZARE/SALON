import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-5 py-10">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-white p-7 text-center shadow-[var(--shadow-soft)]">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink)] text-[10px] font-semibold tracking-[0.08em] text-white">S</span>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Niet gevonden</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Deze pagina of salon bestaat niet.</p>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-[var(--radius-pill)] bg-[var(--ink)] px-5 text-sm font-medium text-white">
          Naar start
        </Link>
      </div>
    </main>
  );
}
