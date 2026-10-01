import Link from "next/link";
import { signIn } from "../actions";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const message = typeof params.message === "string" ? params.message : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-5 py-10">
      <div className="w-full max-w-md rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ink)] text-[10px] font-semibold tracking-[0.08em] text-white">S</span>
          <span className="text-sm font-semibold tracking-[-0.03em]">SALON</span>
        </Link>

        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Welkom terug</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Log in om je planning en afspraken te beheren.</p>

        <form action={signIn} className="mt-7 grid gap-4">
          <Field label="E-mail" name="email" type="email" inputMode="email" autoComplete="email" required />
          <Field label="Wachtwoord" name="password" type="password" autoComplete="current-password" required />

          {error ? (
            <div role="alert" className="rounded-[var(--radius-control)] border border-[#e7c3bd] bg-[#fff7f5] p-3.5 text-sm leading-6 text-[var(--danger)]">
              {error}
            </div>
          ) : null}

          {message ? (
            <div role="status" className="rounded-[var(--radius-control)] bg-[var(--accent-soft)] p-3.5 text-sm leading-6 text-[#74411f]">
              {message}
            </div>
          ) : null}

          <Button size="lg" className="mt-1 w-full">Inloggen</Button>
        </form>

        <p className="mt-7 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]">
          Nog geen account?{" "}
          <Link href="/signup" className="font-medium text-[var(--foreground)] underline decoration-[var(--line)] underline-offset-4">
            Start hier
          </Link>
        </p>
      </div>
    </main>
  );
}
