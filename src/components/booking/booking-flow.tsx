"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import { formatMoney } from "@/lib/format";
import { WaitlistJoinForm } from "@/components/booking/waitlist-join-form";
import type { PublicService, PublicStaff } from "@/services/public-booking";

type Props = {
  salon: { slug: string; name: string; timezone: string; currency: string; allowStaffChoice: boolean };
  services: PublicService[];
  staffByService: Record<string, PublicStaff[]>;
};

type Slot = { start: string; serviceEnd: string; staffIds: string[] };

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
  return new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(new Date(iso));
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

  const service = services.find((item) => item.id === serviceId) ?? null;
  const staff = serviceId ? staffByService[serviceId] ?? [] : [];
  const serviceGroups = useMemo(() => {
    const groups = new Map<string,{label:string;items:PublicService[]}>();
    for (const item of services) {
      const key=item.categoryId??"uncategorized";
      const current=groups.get(key)??{label:item.categoryName??"Behandelingen",items:[]};
      current.items.push(item);groups.set(key,current);
    }
    return [...groups.values()];
  }, [services]);
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
    const data = new FormData(event.currentTarget);
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
          customer: {
            name: data.get("name"),
            phone: data.get("phone"),
            email: data.get("email"),
            note: data.get("note"),
          },
        }),
      });
      const payload = await response.json();
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
      <div className="mb-7 flex items-center gap-2" aria-label={`Stap ${visibleStep} van ${totalSteps}`}>
        {Array.from({ length: totalSteps }, (_, index) => index + 1).map((item) => (
          <span key={item} className={`h-1 flex-1 rounded-full ${item <= visibleStep ? "bg-[var(--primary)]" : "bg-[#e4e4df]"}`} />
        ))}
      </div>

      {step === 1 ? (
        <section>
          <p className="text-sm font-medium text-[var(--muted)]">Stap 1</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em]">Welke behandeling wil je?</h1>
          <div className="mt-6 grid gap-6">
            {serviceGroups.map((group) => (
              <section key={group.label}>
                {serviceGroups.length > 1 ? <h2 className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[var(--muted)]">{group.label}</h2> : null}
                <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => { setServiceId(item.id); setStaffId(null); setStep(salon.allowStaffChoice ? 2 : 3); }}
                      className="flex w-full items-start justify-between gap-5 py-4 text-left transition hover:bg-black/[.018]"
                    >
                      <span>
                        <span className="block text-[15px] font-semibold">{item.name}</span>
                        <span className="mt-1 block text-sm text-[var(--muted)]">{item.durationMinutes} min{item.description ? ` · ${item.description}` : ""}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold">{formatMoney(item.priceCents, item.currency)}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ) : null}

      {step === 2 && service ? (
        <section>
          <button type="button" className="mb-5 text-sm text-[var(--muted)] hover:text-black" onClick={() => setStep(1)}>← Behandeling</button>
          <p className="text-sm font-medium text-[var(--muted)]">{service.name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.025em]">Heb je een voorkeur?</h1>
          <div className="mt-6 divide-y divide-[var(--border)] border-y border-[var(--border)]">
            <button type="button" onClick={() => { setStaffId(null); setStep(3); }} className="w-full py-4 text-left">
              <span className="block text-[15px] font-semibold">Geen voorkeur</span>
              <span className="mt-1 block text-sm text-[var(--muted)]">We kiezen automatisch een beschikbare medewerker.</span>
            </button>
            {staff.map((member) => (
              <button key={member.id} type="button" onClick={() => { setStaffId(member.id); setStep(3); }} className="w-full py-4 text-left">
                <span className="block text-[15px] font-semibold">{member.name}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 3 && service ? (
        <section>
          <button type="button" className="mb-5 text-sm text-[var(--muted)] hover:text-black" onClick={() => setStep(salon.allowStaffChoice ? 2 : 1)}>← {salon.allowStaffChoice ? "Medewerker" : "Behandeling"}</button>
          <h1 className="text-2xl font-semibold tracking-[-0.025em]">Kies een tijd</h1>
          <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-2">
            {dates.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setDate(item.value)}
                className={`min-w-[76px] rounded-[12px] border px-3 py-3 text-center ${date === item.value ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-white"}`}
              >
                <span className="block text-xs capitalize text-[var(--muted)]">{item.weekday}</span>
                <span className="mt-0.5 block text-sm font-semibold">{item.day}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 min-h-36">
            {loadingSlots ? <div className="grid grid-cols-3 gap-2" aria-label="Tijdstippen laden">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-11 animate-pulse rounded-[10px] bg-[#e9e9e5]" />)}</div> : null}
            {!loadingSlots && slotError ? <div className="rounded-[12px] border border-[#f0cbc6] bg-[#fff6f5] p-4 text-sm text-[var(--danger)]">{slotError}</div> : null}
            {!loadingSlots && !slotError && !slots.length ? <div className="border-y border-[var(--border)] py-7 text-sm text-[var(--muted)]"><p>Geen beschikbare tijden op deze dag. Kies een andere datum of laat weten dat je deze dag zoekt.</p><WaitlistJoinForm salonSlug={salon.slug} serviceId={service.id} staffId={staffId} date={date}/></div> : null}
            {!loadingSlots && slots.length ? (
              <div className="grid grid-cols-3 gap-2">
                {slots.map((item) => (
                  <button
                    key={item.start}
                    type="button"
                    onClick={() => setSlot(item.start)}
                    className={`h-11 rounded-[10px] border text-sm font-medium ${slot === item.start ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-white hover:border-[#9bbeb4]"}`}
                  >{timeLabel(item.start, salon.timezone)}</button>
                ))}
              </div>
            ) : null}
          </div>
          <Button className="mt-7 w-full" size="lg" disabled={!slot} onClick={() => setStep(4)}>Verder</Button>
        </section>
      ) : null}

      {step === 4 && service && slot ? (
        <section>
          <button type="button" className="mb-5 text-sm text-[var(--muted)] hover:text-black" onClick={() => setStep(3)}>← Tijdstip</button>
          <h1 className="text-2xl font-semibold tracking-[-0.025em]">Je gegevens</h1>
          <div className="mt-4 border-y border-[var(--border)] py-4 text-sm">
            <div className="flex justify-between gap-3"><span className="text-[var(--muted)]">Behandeling</span><span className="font-medium">{service.name}</span></div>
            <div className="mt-2 flex justify-between gap-3"><span className="text-[var(--muted)]">Tijd</span><span className="font-medium">{timeLabel(slot, salon.timezone)}</span></div>
            <div className="mt-2 flex justify-between gap-3"><span className="text-[var(--muted)]">Prijs</span><span className="font-medium">{formatMoney(service.priceCents, service.currency)}</span></div>
          </div>
          <form onSubmit={submit} className="mt-6 grid gap-4">
            <Field label="Naam" name="name" autoComplete="name" required maxLength={160} />
            <Field label="Telefoon" name="phone" type="tel" autoComplete="tel" required maxLength={40} />
            <Field label="E-mail" name="email" type="email" autoComplete="email" required maxLength={254} />
            <TextAreaField label="Notitie (optioneel)" name="note" maxLength={1000} placeholder="Bijvoorbeeld iets dat de salon vooraf moet weten." />
            {formError ? <div role="alert" className="rounded-[12px] border border-[#f0cbc6] bg-[#fff6f5] p-3.5 text-sm text-[var(--danger)]">{formError}</div> : null}
            <Button size="lg" className="mt-1 w-full" disabled={submitting}>{submitting ? "Boeking bevestigen…" : "Afspraak bevestigen"}</Button>
          </form>
        </section>
      ) : null}

      {step === 5 && appointmentId ? (
        <section className="py-8 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary-soft)] text-lg text-[var(--primary)]">✓</div>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.025em]">Je afspraak staat gepland</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">{salon.name} heeft je afspraak ontvangen. Bewaar deze pagina totdat de salonbevestiging is afgerond.</p>
          <p className="mt-5 text-xs text-[var(--muted)]">Referentie {appointmentId.slice(0, 8).toUpperCase()}</p>
        </section>
      ) : null}
    </div>
  );
}
