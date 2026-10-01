"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import { formatMoney } from "@/lib/format";
import type { PublicService, PublicStaff } from "@/services/public-booking";

type Props = {
  salon: { slug: string; name: string; timezone: string; currency: string; allowStaffChoice: boolean };
  services: PublicService[];
  staffByService: Record<string, PublicStaff[]>;
};

type Slot = { start: string; serviceEnd: string; staffIds: string[] };

type CustomerDraft = {
  name: string;
  phone: string;
  email: string;
  note: string;
};

function todayInTimezone(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function dateChoices(timezone: string) {
  const today = new Date(`${todayInTimezone(timezone)}T12:00:00Z`);
  return Array.from({ length: 14 }, (_, index) => {
    const value = new Date(today.getTime() + index * 86_400_000);
    return {
      value: value.toISOString().slice(0, 10),
      weekday: new Intl.DateTimeFormat("nl-NL", { weekday: "short", timeZone: "UTC" }).format(value),
      day: new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "UTC" }).format(value),
    };
  });
}

function timeLabel(iso: string, timezone: string) {
  return new Intl.DateTimeFormat("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(iso));
}

export function BookingFlow({ salon, services, staffByService }: Props) {
  const dates = useMemo(() => dateChoices(salon.timezone), [salon.timezone]);
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState(dates[0]?.value ?? "");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slot, setSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft>({
    name: "",
    phone: "",
    email: "",
    note: "",
  });

  const service = services.find((item) => item.id === serviceId) ?? null;
  const staff = serviceId ? staffByService[serviceId] ?? [] : [];
  const visibleStep = salon.allowStaffChoice
    ? step
    : ({ 1: 1, 3: 2, 4: 3, 5: 4 } as Record<number, number>)[step] ?? 1;
  const totalSteps = salon.allowStaffChoice ? 5 : 4;

  useEffect(() => {
    if (!serviceId || step !== 3) return;

    const controller = new AbortController();
    setLoadingSlots(true);
    setSlotError(null);
    setSlot(null);

    const params = new URLSearchParams({ serviceId, date });
    if (staffId) params.set("staffId", staffId);

    fetch(`/api/public/${encodeURIComponent(salon.slug)}/availability?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Beschikbaarheid kon niet worden geladen.");
        setSlots(payload.slots ?? []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSlots([]);
        setSlotError(error instanceof Error ? error.message : "Beschikbaarheid kon niet worden geladen.");
      })
      .finally(() => setLoadingSlots(false));

    return () => controller.abort();
  }, [date, salon.slug, serviceId, staffId, step]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serviceId || !slot) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch(`/api/public/${encodeURIComponent(salon.slug)}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          staffId,
          startsAt: slot,
          customer: customerDraft,
        }),
      });
      const payload = await response.json();

      if (response.status === 409) {
        setFormError(payload.error || "Dit tijdstip is niet meer beschikbaar. Kies een ander tijdstip.");
        setStep(3);
        return;
      }

      if (!response.ok) throw new Error(payload.error || "Boeken is niet gelukt.");

      setAppointmentId(payload.appointmentId);
      setStep(5);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Boeken is niet gelukt.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-8" aria-label={`Stap ${visibleStep} van ${totalSteps}`}>
        <div className="mb-3 flex items-center justify-between text-[11px] font-medium text-[var(--muted)]">
          <span>Stap {visibleStep} van {totalSteps}</span>
          <span>{salon.name}</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }, (_, index) => index + 1).map((item) => (
            <span
              key={item}
              className={`h-1 flex-1 rounded-full transition-colors ${item <= visibleStep ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"}`}
            />
          ))}
        </div>
      </div>

      {step === 1 ? (
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Behandeling</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.045em]">Wat wil je boeken?</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Kies de behandeling die bij je afspraak past.</p>

          <div className="mt-7 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {services.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setServiceId(item.id);
                  setStaffId(null);
                  setFormError(null);
                  setStep(salon.allowStaffChoice ? 2 : 3);
                }}
                className="group flex min-h-[76px] w-full items-start justify-between gap-5 py-4 text-left"
              >
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold tracking-[-0.02em]">{item.name}</span>
                  <span className="mt-1 block text-sm leading-5 text-[var(--muted)]">
                    {item.durationMinutes} min{item.description ? ` · ${item.description}` : ""}
                  </span>
                </span>
                <span className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums">
                  {formatMoney(item.priceCents, item.currency)}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 2 && service ? (
        <section>
          <button
            type="button"
            className="mb-6 min-h-10 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={() => setStep(1)}
          >
            ← Behandeling
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{service.name}</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.045em]">Heb je een voorkeur?</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Geen voorkeur geeft je de meeste beschikbare tijden.</p>

          <div className="mt-7 grid gap-2">
            <button
              type="button"
              onClick={() => {
                setStaffId(null);
                setFormError(null);
                setStep(3);
              }}
              className="rounded-[var(--radius-card-sm)] bg-[var(--ink)] px-5 py-4 text-left text-white"
            >
              <span className="block text-[15px] font-semibold">Geen voorkeur</span>
              <span className="mt-1 block text-sm leading-5 text-white/58">SALON kiest automatisch een beschikbare medewerker.</span>
            </button>

            {staff.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  setStaffId(member.id);
                  setFormError(null);
                  setStep(3);
                }}
                className="min-h-14 rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-4 text-left text-[15px] font-semibold hover:bg-[var(--surface)]"
              >
                {member.name}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 3 && service ? (
        <section>
          <button
            type="button"
            className="mb-6 min-h-10 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={() => {
              setFormError(null);
              setStep(salon.allowStaffChoice ? 2 : 1);
            }}
          >
            ← {salon.allowStaffChoice ? "Medewerker" : "Behandeling"}
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Datum & tijd</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.045em]">Wanneer komt het uit?</h1>

          {formError ? (
            <div role="alert" className="mt-5 rounded-[var(--radius-control)] border border-[#e7c3bd] bg-[#fff7f5] p-4 text-sm leading-6 text-[var(--danger)]">
              {formError}
            </div>
          ) : null}

          <div className="-mx-1 mt-6 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
            {dates.map((item) => {
              const selected = date === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setDate(item.value);
                    setFormError(null);
                  }}
                  className={`min-w-[76px] snap-start rounded-[18px] border px-3 py-3 text-center transition-colors ${selected ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line)] bg-white"}`}
                >
                  <span className={`block text-[11px] capitalize ${selected ? "text-white/55" : "text-[var(--muted)]"}`}>{item.weekday}</span>
                  <span className="mt-1 block text-sm font-semibold">{item.day}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-7 min-h-40">
            {loadingSlots ? (
              <div className="grid grid-cols-3 gap-2" aria-label="Tijdstippen laden">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-[var(--radius-control)] bg-[var(--surface)]" />
                ))}
              </div>
            ) : null}

            {!loadingSlots && slotError ? (
              <div className="rounded-[var(--radius-control)] border border-[#e7c3bd] bg-[#fff7f5] p-4 text-sm leading-6 text-[var(--danger)]">
                {slotError}
              </div>
            ) : null}

            {!loadingSlots && !slotError && !slots.length ? (
              <div className="rounded-[var(--radius-card-sm)] bg-[var(--surface)] px-5 py-7 text-sm leading-6 text-[var(--muted)]">
                Geen beschikbare tijden op deze dag. Kies een andere datum.
              </div>
            ) : null}

            {!loadingSlots && slots.length ? (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((item) => {
                  const selected = slot === item.start;
                  return (
                    <button
                      key={item.start}
                      type="button"
                      onClick={() => {
                        setSlot(item.start);
                        setFormError(null);
                      }}
                      className={`min-h-12 rounded-[var(--radius-pill)] border text-sm font-semibold tabular-nums transition-colors ${selected ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] bg-white hover:border-[var(--accent-light)]"}`}
                    >
                      {timeLabel(item.start, salon.timezone)}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <Button className="mt-7 w-full" size="lg" disabled={!slot} onClick={() => setStep(4)}>
            Verder
          </Button>
        </section>
      ) : null}

      {step === 4 && service && slot ? (
        <section>
          <button
            type="button"
            className="mb-6 min-h-10 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={() => setStep(3)}
          >
            ← Tijdstip
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Afronden</p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-[-0.045em]">Je gegevens</h1>

          <div className="mt-6 rounded-[var(--radius-card-sm)] bg-[var(--surface)] p-4 text-sm sm:p-5">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--muted)]">Behandeling</span>
              <span className="min-w-0 truncate text-right font-medium">{service.name}</span>
            </div>
            <div className="mt-3 flex justify-between gap-4">
              <span className="text-[var(--muted)]">Tijd</span>
              <span className="font-medium tabular-nums">{timeLabel(slot, salon.timezone)}</span>
            </div>
            <div className="mt-3 flex justify-between gap-4">
              <span className="text-[var(--muted)]">Prijs</span>
              <span className="font-medium tabular-nums">{formatMoney(service.priceCents, service.currency)}</span>
            </div>
          </div>

          <form onSubmit={submit} className="mt-7 grid gap-4">
            <Field
              label="Naam"
              name="name"
              autoComplete="name"
              required
              maxLength={160}
              value={customerDraft.name}
              onChange={(event) => setCustomerDraft((current) => ({ ...current, name: event.target.value }))}
            />
            <Field
              label="Telefoon"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={40}
              value={customerDraft.phone}
              onChange={(event) => setCustomerDraft((current) => ({ ...current, phone: event.target.value }))}
            />
            <Field
              label="E-mail"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={254}
              value={customerDraft.email}
              onChange={(event) => setCustomerDraft((current) => ({ ...current, email: event.target.value }))}
            />
            <TextAreaField
              label="Notitie (optioneel)"
              name="note"
              maxLength={1000}
              placeholder="Bijvoorbeeld iets dat de salon vooraf moet weten."
              value={customerDraft.note}
              onChange={(event) => setCustomerDraft((current) => ({ ...current, note: event.target.value }))}
            />

            {formError ? (
              <div role="alert" className="rounded-[var(--radius-control)] border border-[#e7c3bd] bg-[#fff7f5] p-4 text-sm leading-6 text-[var(--danger)]">
                {formError}
              </div>
            ) : null}

            <Button size="lg" className="mt-1 w-full" disabled={submitting}>
              {submitting ? "Afspraak vastleggen…" : "Afspraak bevestigen"}
            </Button>
          </form>
        </section>
      ) : null}

      {step === 5 && appointmentId ? (
        <section className="py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--ink)] text-2xl text-white" aria-hidden="true">✓</div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Bevestigd</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Je afspraak staat gepland</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">
            {salon.name} heeft je afspraak ontvangen. Je hoeft geen account aan te maken.
          </p>
          <div className="mx-auto mt-7 max-w-xs rounded-[var(--radius-pill)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--muted)]">
            Referentie {appointmentId.slice(0, 8).toUpperCase()}
          </div>
        </section>
      ) : null}
    </div>
  );
}
