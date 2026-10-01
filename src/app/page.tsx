import Link from "next/link";
import { isPreviewDemoMode } from "@/lib/preview-mode";
import { MarketingHeader } from "@/components/marketing/site-header";

function ProductWindow() {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-black/6 bg-[#f8f7f5] p-3 shadow-[0_35px_90px_rgba(20,18,15,0.13)] sm:rounded-[34px] sm:p-4">
      <div className="rounded-[22px] border border-[var(--line)] bg-white p-4 sm:p-6">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Vandaag</p>
            <p className="mt-1 text-lg font-semibold tracking-[-0.035em]">Je dag</p>
          </div>
          <span className="rounded-full bg-[var(--ink)] px-3 py-2 text-[10px] font-medium text-white">+ Afspraak</span>
        </div>

        <div className="mt-4 rounded-[22px] bg-[var(--ink)] p-4 text-white sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-light)]">Volgende afspraak</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <span className="text-4xl font-semibold tracking-[-0.06em] tabular-nums">12:30</span>
            <span className="text-right text-xs leading-5 text-white/55">Thai Massage<br />60 min</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 rounded-[18px] bg-[var(--surface)] p-4">
          <div>
            <p className="text-xl font-semibold">6</p>
            <p className="mt-1 text-[9px] text-[var(--muted)]">afspraken</p>
          </div>
          <div className="border-l border-[var(--line)] pl-3">
            <p className="text-xl font-semibold">€390</p>
            <p className="mt-1 text-[9px] text-[var(--muted)]">gepland</p>
          </div>
          <div className="border-l border-[var(--line)] pl-3">
            <p className="text-xl font-semibold">12:30</p>
            <p className="mt-1 text-[9px] text-[var(--muted)]">volgende</p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {[
            ["09:00", "Thai Massage", "60 min"],
            ["11:00", "Deep Tissue", "45 min"],
            ["12:30", "Thai Massage", "60 min"],
          ].map(([time, service, meta]) => (
            <div key={time} className="grid grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-3 py-3">
              <span className="text-xs font-semibold tabular-nums">{time}</span>
              <span className="truncate text-xs font-medium">{service}</span>
              <span className="text-[9px] text-[var(--muted)]">{meta}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-3 -right-3 w-[43%] min-w-[145px] rounded-[24px] border border-[var(--line)] bg-white p-3 shadow-[0_24px_55px_rgba(17,17,17,0.16)] sm:bottom-5 sm:right-5">
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">Online booking</p>
        <p className="mt-2 text-xs font-semibold">Kies een tijd</p>
        <div className="mt-3 grid grid-cols-2 gap-1.5">
          {["13:30", "14:15", "15:30", "16:45"].map((time, index) => (
            <span key={time} className={`rounded-full border px-2 py-2 text-center text-[9px] font-semibold ${index === 1 ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)]"}`}>
              {time}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShowcasePanel({ type }: { type: "today" | "calendar" | "booking" | "customers" }) {
  if (type === "calendar") {
    return (
      <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 sm:p-6">
        <div className="flex gap-2 overflow-hidden">
          {["Ma 28", "Di 29", "Wo 30", "Do 1"].map((day, index) => (
            <span key={day} className={`min-w-[62px] rounded-[16px] px-3 py-3 text-center text-[10px] font-medium ${index === 3 ? "bg-[var(--ink)] text-white" : "bg-white text-[var(--muted)]"}`}>{day}</span>
          ))}
        </div>
        <div className="mt-5 grid gap-2">
          {[["09:00", "Thai Massage"], ["10:30", "Beschikbaar"], ["12:30", "Deep Tissue"]].map(([time, label], index) => (
            <div key={time} className="grid grid-cols-[46px_minmax(0,1fr)] items-center gap-3">
              <span className="text-[10px] font-semibold text-[var(--muted)]">{time}</span>
              <div className={`rounded-[16px] px-4 py-3 text-xs font-medium ${index === 1 ? "border border-dashed border-[var(--line)] bg-transparent text-[var(--muted)]" : "bg-white"}`}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "booking") {
    return (
      <div className="rounded-[var(--radius-card)] bg-[var(--ink)] p-5 text-white sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-light)]">Klant</p>
        <p className="mt-2 text-xl font-semibold tracking-[-0.035em]">Wanneer komt het uit?</p>
        <div className="mt-5 flex gap-2 overflow-hidden">
          {["Vr 2", "Za 3", "Zo 4"].map((day, index) => (
            <span key={day} className={`min-w-[72px] rounded-[16px] px-3 py-3 text-center text-xs ${index === 0 ? "bg-white text-[var(--ink)]" : "bg-white/8 text-white/55"}`}>{day}</span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {["10:00", "11:30", "13:15", "14:30", "16:00", "17:15"].map((time, index) => (
            <span key={time} className={`rounded-full border px-2 py-2.5 text-center text-[10px] font-semibold ${index === 3 ? "border-[var(--accent)] bg-[var(--accent)]" : "border-white/12"}`}>{time}</span>
          ))}
        </div>
      </div>
    );
  }

  if (type === "customers") {
    return (
      <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-5 sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Customers</p>
        <div className="mt-4 divide-y divide-[var(--line)]">
          {["Vaste klant", "Nieuwe klant", "Terugkerende klant"].map((label, index) => (
            <div key={label} className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[10px] font-semibold">0{index + 1}</span>
              <span>
                <span className="block text-xs font-semibold">{label}</span>
                <span className="mt-0.5 block text-[9px] text-[var(--muted)]">Afspraakgeschiedenis</span>
              </span>
              <span className="text-xs text-[var(--subtle)]">→</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-5 sm:p-7">
      <div className="rounded-[20px] bg-white p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Volgende afspraak</p>
        <p className="mt-3 text-4xl font-semibold tracking-[-0.06em]">12:30</p>
        <p className="mt-3 text-sm font-semibold">Thai Massage</p>
        <p className="mt-1 text-[10px] text-[var(--muted)]">60 min · bevestigd</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-[16px] bg-white p-4"><p className="text-lg font-semibold">6</p><p className="text-[9px] text-[var(--muted)]">afspraken</p></div>
        <div className="rounded-[16px] bg-white p-4"><p className="text-lg font-semibold">12:30</p><p className="text-[9px] text-[var(--muted)]">volgende</p></div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const preview = isPreviewDemoMode();
  const primaryHref = preview ? "/app/today" : "/signup";
  const primaryLabel = preview ? "Open SALON" : "Start met SALON";

  return (
    <main className="min-h-screen bg-white">
      <MarketingHeader primaryHref={primaryHref} primaryLabel={primaryLabel} />

      <section className="mx-auto max-w-[88rem] px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:px-10">
        <div className="grid items-end gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div className="salon-enter max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Salon management, zonder gedoe</p>
            <h1 className="mt-5 text-[clamp(3.4rem,8vw,7.8rem)] font-semibold leading-[0.88] tracking-[-0.075em]">
              Je salondag,
              <br />
              rustig geregeld.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
              Van klantvraag naar afspraak, zonder eindeloze WhatsApp-berichten of agenda-chaos. SALON laat klanten de juiste tijd zelf boeken en houdt jouw dag helder.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={primaryHref} className="inline-flex min-h-12 items-center rounded-[var(--radius-pill)] bg-[var(--ink)] px-6 text-sm font-medium text-white">
                {primaryLabel} →
              </Link>
              <a href="#booking" className="inline-flex min-h-12 items-center rounded-[var(--radius-pill)] border border-[var(--line)] bg-white px-6 text-sm font-medium">
                Zie hoe booking werkt
              </a>
            </div>
          </div>

          <div className="salon-enter-delay">
            <ProductWindow />
          </div>
        </div>
      </section>

      <section id="booking" className="scroll-mt-24 bg-[var(--surface)]">
        <div className="mx-auto max-w-[88rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Smart booking</p>
              <h2 className="mt-4 text-[clamp(2.6rem,6vw,5.4rem)] font-semibold leading-[0.95] tracking-[-0.065em]">
                Een klant vraagt wanneer je plek hebt.
                <br />
                SALON weet het al.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[var(--muted)] lg:justify-self-end">
              Kies de behandeling en eventueel een medewerker. De klant krijgt alleen echte beschikbare tijden en rondt de afspraak zelf af.
            </p>
          </div>

          <div className="mt-14 grid gap-2 md:grid-cols-4">
            {[
              ["01", "Bericht", "De klant vraagt om een tijd."],
              ["02", "Beschikbaarheid", "SALON controleert rooster, blocks en afspraken."],
              ["03", "Boeken", "De klant ziet alleen geldige tijden."],
              ["04", "Today", "De afspraak staat direct in je dag."],
            ].map(([number, title, copy], index) => (
              <div key={number} className={`min-h-48 rounded-[var(--radius-card-sm)] p-5 ${index === 2 ? "bg-[var(--accent)] text-white" : "bg-white"}`}>
                <p className={`text-[10px] font-semibold ${index === 2 ? "text-white/60" : "text-[var(--muted)]"}`}>{number}</p>
                <p className="mt-12 text-xl font-semibold tracking-[-0.035em]">{title}</p>
                <p className={`mt-2 text-sm leading-6 ${index === 2 ? "text-white/70" : "text-[var(--muted)]"}`}>{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="scroll-mt-24 mx-auto max-w-[88rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Het product</p>
          <h2 className="mt-4 text-[clamp(2.7rem,6vw,5.6rem)] font-semibold leading-[0.94] tracking-[-0.065em]">
            Minder schermen.
            <br />
            Meer overzicht.
          </h2>
        </div>

        <div className="mt-16 grid gap-x-14 gap-y-20 lg:grid-cols-2">
          {[
            ["Today", "Alles wat vandaag telt.", "Je volgende afspraak, je planning en de acties die je nu nodig hebt.", "today"],
            ["Calendar", "Zie de dag in één oogopslag.", "Een rustige dagtimeline die werkt op telefoon én desktop.", "calendar"],
            ["Booking", "Klanten boeken de juiste tijd zelf.", "Geen account, geen ongeldige slots, geen uitleg nodig.", "booking"],
            ["Customers", "Context zonder CRM-complexiteit.", "Contact en afspraakgeschiedenis op één rustige plek.", "customers"],
          ].map(([title, headline, copy, type]) => (
            <article key={title} className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{title}</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{headline}</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">{copy}</p>
              <div className="mt-7">
                <ShowcasePanel type={type as "today" | "calendar" | "booking" | "customers"} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[88rem] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10">
        <div className="overflow-hidden rounded-[var(--radius-card)] bg-[var(--ink)] px-5 py-10 text-white sm:px-9 sm:py-14 lg:px-14 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-light)]">Availability engine</p>
              <h2 className="mt-4 text-[clamp(2.6rem,6vw,5.6rem)] font-semibold leading-[0.94] tracking-[-0.065em]">
                Gebouwd rond echte beschikbaarheid.
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-white/55 lg:justify-self-end">
              Beschikbaarheid is geen groen vakje in de browser. SALON controleert de regels op de server en beschermt afspraken ook in de database.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-[20px] bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
            {[
              "Werkroosters",
              "Pauzes",
              "Geblokkeerde tijd",
              "Duur + buffer",
              "Geen overlap",
            ].map((item) => (
              <div key={item} className="bg-[var(--ink)] px-5 py-6">
                <span className="mb-8 block h-2 w-2 rounded-full bg-[var(--accent-light)]" />
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="salons" className="scroll-mt-24 mx-auto max-w-[88rem] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10">
        <div className="grid gap-10 border-y border-[var(--line)] py-14 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Voor kleine teams</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">Software die niet om aandacht vraagt.</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:pl-10">
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em]">Mobiel als uitgangspunt</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Afspraken beheren tussen klanten door, zonder een desktopworkflow op een klein scherm te persen.</p>
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[-0.03em]">Simpel voor dagelijks werk</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Geen enterprise CRM, payroll of dashboards vol cijfers. Alleen wat je salon nu nodig heeft.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-3 rounded-t-[36px] bg-[var(--ink)] px-5 pb-8 pt-14 text-white sm:mx-5 sm:rounded-t-[48px] sm:px-9 sm:pt-20">
        <div className="mx-auto max-w-[84rem]">
          <div className="flex flex-col gap-8 border-b border-white/12 pb-12 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-light)]">SALON</p>
              <h2 className="mt-4 max-w-3xl text-[clamp(2.8rem,7vw,6.5rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
                Klaar voor een rustigere salondag?
              </h2>
            </div>
            <Link href={primaryHref} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-white px-6 text-sm font-medium text-[var(--ink)]">
              {primaryLabel} →
            </Link>
          </div>

          <div className="flex flex-col gap-7 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold tracking-[-0.03em]">SALON</p>
            <nav className="flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/50">
              <a href="#product">Product</a>
              <a href="#booking">Booking</a>
              <a href="#salons">Voor salons</a>
              <Link href="/login">Inloggen</Link>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
}
