"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

type Staff = { id: string; name: string };
type Slot = { start: string };

const selectClassName =
  "min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-3.5 text-[15px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(177,95,44,0.10)]";

export function RescheduleForm({
  appointmentId,
  serviceId,
  staff,
  initialStaffId,
  timezone,
}: {
  appointmentId: string;
  serviceId: string;
  staff: Staff[];
  initialStaffId: string;
  timezone: string;
}) {
  const router = useRouter();
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
  const [staffId, setStaffId] = useState(initialStaffId);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

  async function save() {
    if (!startsAt) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/internal/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, staffId, startsAt }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      router.push(`/app/appointments/${appointmentId}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verplaatsen is niet gelukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 grid max-w-2xl gap-6 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 sm:p-6">
      <label className="grid gap-2 text-sm font-medium">
        <span>Medewerker</span>
        <select className={selectClassName} value={staffId} onChange={(event) => setStaffId(event.target.value)}>
          {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
      </label>

      <Field label="Datum" type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} />

      <div>
        <p className="mb-3 text-sm font-medium">Beschikbare tijden</p>
        {loading ? (
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-11 animate-pulse rounded-full bg-white" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => {
              const selected = startsAt === slot.start;
              return (
                <button
                  type="button"
                  key={slot.start}
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

        {!loading && !slots.length ? <p className="mt-2 text-sm text-[var(--muted)]">Geen beschikbare tijden voor deze combinatie.</p> : null}
      </div>

      {error ? (
        <div role="alert" className="rounded-[var(--radius-control)] border border-[#e7c3bd] bg-[#fff7f5] p-4 text-sm leading-6 text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <Button size="lg" className="w-full sm:w-auto" disabled={!startsAt || saving} onClick={save}>
        {saving ? "Afspraak verplaatsen…" : "Afspraak verplaatsen"}
      </Button>
    </div>
  );
}
