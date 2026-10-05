import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Prijzen",
  description: "Prijsinformatie en inbegrepen kernfuncties van ORSIRA salonsoftware.",
};

const included = [
  "Agenda voor dag, week en maand",
  "Klanten en klantdetails",
  "Diensten en categorieën",
  "Team en openingstijden",
  "Rapportage en CSV-export",
  "Online booking, booking links en wachtlijst",
  "Intake, toestemming en klant self-service",
] as const;

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--ink)]" data-pricing-information>
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex h-[72px] max-w-[1040px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-display text-[21px] font-extrabold tracking-[-.06em]">ORSIRA</Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="hidden min-h-11 items-center px-3 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] sm:inline-flex">Terug</Link>
            <Link href="/login" className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--primary-hover)]">Open ORSIRA</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1040px] px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="max-w-[760px]">
          <p className="text-sm font-semibold text-[var(--accent-dark)]">Prijzen</p>
          <h1 className="font-display mt-4 text-[clamp(3rem,7vw,5.5rem)] font-extrabold leading-[.92] tracking-[-.07em]">Prijs voor jouw salon.</h1>
          <p className="mt-6 max-w-[680px] text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
            Het definitieve publieke prijsmodel van ORSIRA wordt vóór de commerciële lancering vastgezet. Tot die keuze is gemaakt, tonen we hier bewust geen bedrag dat later kan veranderen.
          </p>
        </div>

        <div className="mt-12 grid overflow-hidden rounded-[16px] border border-[var(--border)] bg-white lg:grid-cols-[.82fr_1.18fr]">
          <div className="border-b border-[var(--border)] bg-[var(--surface-soft)] p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <p className="text-xs font-bold uppercase tracking-[.13em] text-[var(--accent-dark)]">ORSIRA kern</p>
            <h2 className="font-display mt-3 text-3xl font-extrabold tracking-[-.05em]">Eén werkplek voor je salon.</h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">De huidige productkern blijft beschikbaar als één samenhangende ervaring. Geen fictieve pakketten of verstopte featureclaims.</p>
            <Link href="/login" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[var(--secondary)] px-5 text-sm font-bold text-[var(--ink)] hover:bg-[var(--secondary-hover)]">Bekijk de werkplek <span className="ml-2" aria-hidden>→</span></Link>
          </div>
          <div className="p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold">Wat nu al in de productkern zit</h2>
            <div className="mt-5 grid gap-0 border-t border-[var(--border)]">
              {included.map((item) => (
                <div key={item} className="flex gap-3 border-b border-[var(--border)] py-4 text-sm leading-6">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--secondary-soft)] text-xs font-black text-[var(--accent-dark)]" aria-hidden>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-7 max-w-[720px] text-sm leading-6 text-[var(--muted)]">
          Een concrete maand- of jaarprijs is een commerciële productkeuze en wordt daarom niet door deze visuele rebrand verzonnen.
        </p>
      </main>
    </div>
  );
}
