"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";

type Service = { id: string; name: string; duration_minutes: number };
type Staff = { id: string; name: string };
type Slot = { start: string };
type Customer = { id: string; name: string; phone: string | null; email: string | null };

const selectClassName =
  "min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-3.5 text-[15px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(177,95,44,0.10)]";

export function NewAppointmentForm({
  services,
  staffByService,
  customers,
  timezone,
}: {
  services: Service[];
  staffByService: Record<string, Staff[]>;
  customers: Customer[];
  timezone: string;
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const staff = staffByService[serviceId] ?? [];
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    [timezone],
  );
  const [date, setDate] = useState(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  useEffect(() => {
    const next = (staffByService[serviceId] ?? [])[0]?.id ?? "";
    setStaffId(next);
    setStartsAt("");
  }, [serviceId, staffByService]);

  function chooseCustomer(id: string) {
    setCustomerId(id);
    const customer = customers.find((item) => item.id === id);
    setCustomerName(customer?.name ?? "");
    setCustomerPhone(customer?.phone ?? "");
    setCustomerEmail(customer?.email ?? "");
  }

  useEffect(() => {
    if (!serviceId || !staffId || !date) {
      setSlots([]);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setStartsAt("");

    fetch(`/api/internal/availability?serviceId=${serviceId}&staffId=${staffId}&date=${date}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setSlots(payload.slots ?? []);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Beschikbaarheid kon niet worden geladen.");
        setSlots([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [date, serviceId, staffId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startsAt) return;

    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/internal/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          staffId,
          startsAt,
          customerId: customerId || null,
          customer: {
            name: data.get("name"),
            phone: data.get("phone"),
            email: data.get("email"),
            note: data.get("note"),
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      router.push(`/app/appointments/${payload.appointmentId}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Opslaan is niet gelukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 grid max-w-2xl gap-7">
      <section className="grid gap-4 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Afspraak</p>
        </div>
        <label className="grid gap-2 text-sm font-medium">
          <span>Behandeling</span>
          <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className={selectClassName}>
            {services.map((service) => (
              <option key={service.id} value={service.id}>{service.name} · {service.duration_minutes} min</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          <span>Medewerker</span>
          <select value={staffId} onChange={(event) => setStaffId(event.target.value)} className={selectClassName}>
            {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
        </label>
        <div className="sm:col-span-2">
          <Field label="Datum" type="date" value={date} min={today} onChange={(event) => setDate(event.target.value)} required />
        </div>

        <div className="sm:col-span-2">
          <p className="mb-3 text-sm font-medium">Tijd</p>
          {loading ? (
            <div className="grid grid-cols-3 gap-2" aria-label="Tijdstippen laden">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-11 animate-pulse rounded-[var(--radius-pill)] bg-white" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((slot) => {
                const selected = startsAt === slot.start;
                return (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => setStartsAt(slot.start)}
                    className={`min-h-11 rounded-[var(--radius-pill)] border text-sm font-semibold tabular-nums ${selected ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] bg-white"}`}
                  >
                    {new Intl.DateTimeFormat("nl-NL", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: timezone,
                    }).format(new Date(slot.start))}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !slots.length ? (
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Geen beschikbare tijden voor deze combinatie.</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Klant</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.035em]">Wie komt er?</h2>
        </div>

        <label className="grid gap-2 text-sm font-medium">
          <span>Bestaande klant</span>
          <select value={customerId} onChange={(event) => chooseCustomer(event.target.value)} className={selectClassName}>
            <option value="">Nieuwe klant</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}{customer.phone ? ` · ${customer.phone}` : ""}
              </option>
            ))}
          </select>
        </label>

        <Field label="Klantnaam" name="name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefoon (optioneel)" name="phone" type="tel" inputMode="tel" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
          <Field label="E-mail (optioneel)" name="email" type="email" inputMode="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
        </div>
        <TextAreaField label="Notitie (optioneel)" name="note" />
      </section>

      {error ? (
        <div role="alert" className="rounded-[var(--radius-control)] border border-[#e7c3bd] bg-[#fff7f5] p-4 text-sm leading-6 text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <Button size="lg" className="w-full sm:w-auto" disabled={!startsAt || saving}>
        {saving ? "Afspraak opslaan…" : "Afspraak opslaan"}
      </Button>
    </form>
  );
}
