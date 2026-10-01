import Link from "next/link";
import { signIn } from "../actions";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const message = typeof params.message === "string" ? params.message : null;
  return <main className="flex min-h-screen items-center justify-center px-5 py-10">
    <div className="w-full max-w-sm">
      <p className="text-xl font-semibold tracking-[-0.025em]">Salon</p>
      <h1 className="mt-10 text-2xl font-semibold tracking-[-0.03em]">Welkom terug</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Log in om je planning en afspraken te beheren.</p>
      <form action={signIn} className="mt-7 grid gap-4">
        <Field label="E-mail" name="email" type="email" autoComplete="email" required />
        <Field label="Wachtwoord" name="password" type="password" autoComplete="current-password" required />
        {error ? <p role="alert" className="text-sm text-[var(--danger)]">{error}</p> : null}
        {message ? <p className="text-sm text-[var(--primary)]">{message}</p> : null}
        <Button size="lg" className="w-full">Inloggen</Button>
      </form>
      <p className="mt-6 text-sm text-[var(--muted)]">Nog geen account? <Link href="/signup" className="font-medium text-[var(--foreground)] underline underline-offset-4">Start hier</Link></p>
    </div>
  </main>;
}
