import Link from "next/link";
import { signUp } from "../actions";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  return <main className="flex min-h-screen items-center justify-center px-5 py-10">
    <div className="w-full max-w-sm">
      <p className="text-xl font-semibold tracking-[-0.025em]">Salon</p>
      <h1 className="mt-10 text-2xl font-semibold tracking-[-0.03em]">Maak je salon boekbaar</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Eerst je account, daarna alleen de gegevens die nodig zijn voor je eerste afspraak.</p>
      <form action={signUp} className="mt-7 grid gap-4">
        <Field label="Naam" name="name" autoComplete="name" required />
        <Field label="E-mail" name="email" type="email" autoComplete="email" required />
        <Field label="Wachtwoord" name="password" type="password" autoComplete="new-password" minLength={8} required hint="Minimaal 8 tekens." />
        {error ? <p role="alert" className="text-sm text-[var(--danger)]">{error}</p> : null}
        <Button size="lg" className="w-full">Account maken</Button>
      </form>
      <p className="mt-6 text-sm text-[var(--muted)]">Al een account? <Link href="/login" className="font-medium text-[var(--foreground)] underline underline-offset-4">Inloggen</Link></p>
    </div>
  </main>;
}
