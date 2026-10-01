import Link from "next/link";
import { isPreviewDemoMode } from "@/lib/preview-mode";

export default function HomePage() {
  const preview = isPreviewDemoMode();
  return <main className="min-h-screen bg-white">
    <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between"><p className="text-lg font-semibold tracking-[-0.025em]">Salon</p><Link href={preview ? "/app/today" : "/login"} className="text-sm font-medium">{preview ? "Open preview" : "Inloggen"}</Link></header>
      <section className="max-w-2xl pb-20 pt-24 sm:pt-32">
        <p className="text-sm font-semibold text-[var(--primary)]">Afspraken zonder gedoe</p>
        <h1 className="mt-4 text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl">Run je salon. Niet je software.</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">Een rustige planning voor kleine massage-, beauty- en wellnessbedrijven. Klanten boeken zelf; jij ziet direct wat vandaag gebeurt.</p>
        <div className="mt-8 flex flex-wrap gap-3">{preview ? <><Link href="/app/today" className="rounded-[11px] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white">Open SALON preview</Link><Link href="/book/baan-thai-demo" className="rounded-[11px] border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold">Bekijk publieke booking</Link></> : <><Link href="/signup" className="rounded-[11px] bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white">Salon instellen</Link><Link href="/login" className="rounded-[11px] border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold">Ik heb al een account</Link></>}</div>
      </section>
      <section className="grid gap-8 border-t border-[var(--border)] py-10 sm:grid-cols-3"><div><h2 className="font-semibold">Today eerst</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Open de app en zie meteen je volgende afspraak, omzet en planning.</p></div><div><h2 className="font-semibold">Boeken in minuten</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Geen klantaccount nodig. Alleen behandeling, tijd en contactgegevens.</p></div><div><h2 className="font-semibold">Geen dubbele boekingen</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Beschikbaarheid en conflicten worden op de server en in PostgreSQL bewaakt.</p></div></section>
    </div>
  </main>;
}
