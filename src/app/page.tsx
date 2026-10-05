import Link from "next/link";

const capabilities = [
  ["Agenda", "Zie je dag, team en beschikbare ruimte in één oogopslag."],
  ["Klanten", "Alle belangrijke klantinformatie dichtbij de afspraak."],
  ["Team", "Werk met duidelijke roosters, diensten en verantwoordelijkheden."],
  ["Rapportage", "Volg de cijfers die helpen om je salon beter te sturen."],
] as const;

const workday = [
  { time: "09:00", client: "Sophie", service: "Knippen + föhnen", accent: "bg-[var(--secondary-soft)]" },
  { time: "11:15", client: "Nora", service: "Balayage", accent: "bg-[#eef3ff]" },
  { time: "14:00", client: "Lina", service: "Brow treatment", accent: "bg-[#fff2e8]" },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--ink)]">
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="font-display text-[21px] font-extrabold tracking-[-.06em]" aria-label="ORSIRA home">
            ORSIRA
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--muted)] md:flex" aria-label="Website navigatie">
            <a href="#product" className="hover:text-[var(--ink)]">Product</a>
            <a href="#voor-salons" className="hover:text-[var(--ink)]">Voor salons</a>
            <Link href="/pricing" className="hover:text-[var(--ink)]">Prijzen</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden min-h-11 items-center px-3 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)] sm:inline-flex">
              Inloggen
            </Link>
            <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]">
              Open ORSIRA
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1180px] gap-12 px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-28">
          <div className="max-w-[620px]">
            <p className="mb-5 text-sm font-semibold text-[var(--accent-dark)]">Salonsoftware die rust brengt in je werkdag</p>
            <h1 className="font-display text-[clamp(3rem,7.5vw,6.5rem)] font-extrabold leading-[.9] tracking-[-.075em]">
              Meer rust in je salon. <span className="text-[var(--accent-dark)]">Meer grip op je dag.</span>
            </h1>
            <p className="mt-7 max-w-[570px] text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
              ORSIRA brengt planning, klanten, team en rapportage samen in één heldere werkplek. Minder schakelen, sneller zien wat aandacht nodig heeft.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[var(--secondary)] px-5 text-[15px] font-bold text-[var(--ink)] transition-colors hover:bg-[var(--secondary-hover)]">
                Bekijk ORSIRA <span className="ml-2" aria-hidden>→</span>
              </Link>
              <a href="#product" className="inline-flex min-h-12 items-center justify-center rounded-[10px] border border-[var(--border-strong)] bg-white px-5 text-[15px] font-semibold hover:bg-[var(--surface-soft)]">
                Zo werkt het
              </a>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--border)] pt-5 text-sm text-[var(--muted)]">
              <span>Planning</span><span>Klanten</span><span>Team</span><span>Rapportage</span>
            </div>
          </div>

          <div id="product" data-orsira-product-preview className="relative min-w-0 scroll-mt-24">
            <div className="absolute -left-5 top-8 h-24 w-24 rounded-full bg-[var(--secondary)] opacity-30 blur-3xl" aria-hidden />
            <div className="relative overflow-hidden rounded-[18px] border border-[var(--border)] bg-white shadow-[0_24px_70px_rgba(23,26,23,.09)]">
              <div className="flex h-12 items-center justify-between border-b border-[var(--border)] px-4 sm:px-5">
                <span className="font-display text-sm font-extrabold tracking-[-.04em]">ORSIRA</span>
                <span className="rounded-[8px] bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">Vandaag</span>
              </div>
              <div className="grid min-h-[430px] grid-cols-[72px_1fr] sm:grid-cols-[150px_1fr]">
                <div className="border-r border-[var(--border)] bg-[var(--surface-soft)] p-3 sm:p-4">
                  <div className="mb-5 h-8 rounded-[8px] bg-[var(--secondary-soft)]" />
                  <div className="grid gap-2.5">
                    {["Agenda", "Klanten", "Team", "Rapporten"].map((item, index) => (
                      <div key={item} className={`h-8 rounded-[8px] ${index === 0 ? "bg-white" : "bg-transparent"}`}>
                        <span className="hidden px-2 text-[11px] font-semibold leading-8 text-[var(--muted)] sm:block">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="min-w-0 p-4 sm:p-6">
                  <div className="flex items-end justify-between gap-3 border-b border-[var(--border)] pb-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[.13em] text-[var(--subtle)]">Maandag</p>
                      <p className="font-display mt-1 text-xl font-bold sm:text-2xl">Je dag staat klaar.</p>
                    </div>
                    <div className="hidden rounded-[9px] bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white sm:block">+ Afspraak</div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {workday.map((appointment) => (
                      <div key={appointment.time} className="grid grid-cols-[52px_1fr] gap-3">
                        <span className="pt-3 text-xs font-semibold text-[var(--subtle)]">{appointment.time}</span>
                        <div className={`min-w-0 rounded-[12px] border border-[var(--border)] p-3.5 ${appointment.accent}`}>
                          <p className="truncate text-sm font-bold">{appointment.client}</p>
                          <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{appointment.service}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4">
                    <div><p className="text-[11px] text-[var(--subtle)]">Afspraken</p><p className="mt-1 text-lg font-bold">8</p></div>
                    <div><p className="text-[11px] text-[var(--subtle)]">Vrije ruimte</p><p className="mt-1 text-lg font-bold">1u 20m</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--border)] bg-white">
          <div className="mx-auto grid max-w-[1180px] divide-y divide-[var(--border)] px-4 sm:px-6 md:grid-cols-4 md:divide-x md:divide-y-0">
            {capabilities.map(([title, body]) => (
              <div key={title} className="py-7 md:px-6 md:first:pl-0 md:last:pr-0">
                <h2 className="font-display text-lg font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="voor-salons" className="mx-auto max-w-[1180px] scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-sm font-semibold text-[var(--accent-dark)]">Gebouwd voor echte salondagen</p>
              <h2 className="font-display mt-4 text-4xl font-extrabold leading-[1.02] tracking-[-.055em] sm:text-5xl">Snel begrijpen wat er speelt. Daarna verder.</h2>
            </div>
            <div className="grid gap-0 border-t border-[var(--border-strong)]">
              {[
                ["01", "Vandaag", "Je planning en wat aandacht nodig heeft staan vooraan, niet verstopt in dashboards."],
                ["02", "Agenda", "Dag, week en maand blijven leesbaar, ook als de planning druk wordt."],
                ["03", "Klant & team", "Werk vanuit dezelfde actuele informatie zonder onnodig dubbel invoeren."],
              ].map(([number, title, body]) => (
                <div key={number} className="grid grid-cols-[42px_1fr] gap-3 border-b border-[var(--border)] py-6 sm:grid-cols-[64px_1fr]">
                  <span className="text-xs font-bold text-[var(--accent-dark)]">{number}</span>
                  <div><h3 className="font-display text-xl font-bold">{title}</h3><p className="mt-2 max-w-[620px] text-sm leading-6 text-[var(--muted)] sm:text-base sm:leading-7">{body}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--primary)] text-white">
          <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-[760px]">
              <p className="text-sm font-semibold text-[#9fe6ab]">Eén rustige werkplek</p>
              <h2 className="font-display mt-4 text-4xl font-extrabold leading-[1.02] tracking-[-.055em] sm:text-5xl">Maak ruimte voor je klanten, niet voor administratie.</h2>
              <p className="mt-5 max-w-[600px] text-base leading-7 text-[#cbd2cc]">Open de bestaande ORSIRA-werkplek en ervaar hoe planning en salonbeheer samenkomen.</p>
            </div>
            <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-[10px] bg-[var(--secondary)] px-5 text-[15px] font-bold text-[var(--ink)] hover:bg-[var(--secondary-hover)]">
              Open ORSIRA <span className="ml-2" aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-display font-extrabold text-[var(--ink)]">ORSIRA</span>
          <div className="flex gap-5"><Link href="/pricing" className="hover:text-[var(--ink)]">Prijzen</Link><Link href="/login" className="hover:text-[var(--ink)]">Inloggen</Link></div>
        </div>
      </footer>
    </div>
  );
}
