import { requireAppContext } from "@/lib/auth";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { getBookingSettings, getOpeningHours, getSalonProfile } from "@/services/app-data";
import { updateBookingSettings, updateOpeningHours, updateSalonProfile } from "./actions";

const dayLabels: Record<number, string> = {
  0: "Zondag",
  1: "Maandag",
  2: "Dinsdag",
  3: "Woensdag",
  4: "Donderdag",
  5: "Vrijdag",
  6: "Zaterdag",
};
const dayOrder = [1, 2, 3, 4, 5, 6, 0];
const shortTime = (value: string | null) => value?.slice(0, 5) ?? "";
const selectClassName =
  "min-h-11 rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-3.5 text-[15px] outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(177,95,44,0.10)]";
const timeClassName =
  "min-h-11 min-w-0 w-full rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-2.5 text-sm tabular-nums outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(177,95,44,0.10)]";

export default async function SettingsPage() {
  const { salon, user, membership } = await requireAppContext();
  const [profile, booking, opening] = await Promise.all([
    getSalonProfile(salon.id),
    getBookingSettings(salon.id),
    getOpeningHours(salon.id),
  ]);
  const openingMap = new Map(opening.map((row) => [row.weekday, row]));
  const owner = membership.role === "owner";

  return (
    <>
      <header className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">Configuratie</p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-none tracking-[-0.055em]">Settings</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Instellingen die je af en toe wijzigt, buiten de dagelijkse planning.</p>
      </header>

      <div className="mt-10 max-w-3xl divide-y divide-[var(--line)] border-y border-[var(--line)]">
        <section className="py-8">
          <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <h2 className="font-semibold tracking-[-0.02em]">Salon</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Naam en contactgegevens.</p>
            </div>
            {owner ? (
              <form action={updateSalonProfile} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field label="Naam" name="name" defaultValue={profile.name} required maxLength={120} />
                </div>
                <Field label="Telefoon" name="phone" defaultValue={profile.phone ?? ""} />
                <Field label="E-mail" name="email" type="email" defaultValue={profile.email ?? ""} />
                <div className="sm:col-span-2">
                  <Field label="Adres" name="address" defaultValue={profile.address ?? ""} />
                </div>
                <p className="sm:col-span-2 text-xs text-[var(--muted)]">Timezone {profile.timezone} · Valuta {profile.currency}</p>
                <div className="sm:col-span-2">
                  <Button variant="secondary">Salon opslaan</Button>
                </div>
              </form>
            ) : (
              <div className="text-sm">
                <p className="font-medium">{profile.name}</p>
                <p className="mt-1 text-[var(--muted)]">{profile.timezone} · {profile.currency}</p>
              </div>
            )}
          </div>
        </section>

        <section className="py-8">
          <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <h2 className="font-semibold tracking-[-0.02em]">Openingstijden</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Je normale salonweek.</p>
            </div>
            {owner ? (
              <form action={updateOpeningHours} className="grid gap-3">
                {dayOrder.map((weekday) => {
                  const row = openingMap.get(weekday);
                  const isOpen = row?.is_open ?? false;
                  return (
                    <div key={weekday} className="rounded-[var(--radius-control)] bg-[var(--surface)] p-3">
                      <div className="grid gap-3 sm:grid-cols-[130px_minmax(0,1fr)] sm:items-center">
                        <label className="flex min-h-10 items-center gap-2 text-sm font-medium">
                          <input type="checkbox" name={`open-${weekday}`} defaultChecked={isOpen} className="h-4 w-4 accent-[var(--accent)]" />
                          {dayLabels[weekday]}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            aria-label={`${dayLabels[weekday]} open`}
                            type="time"
                            name={`start-${weekday}`}
                            defaultValue={shortTime(row?.start_time ?? null) || "09:00"}
                            className={timeClassName}
                          />
                          <input
                            aria-label={`${dayLabels[weekday]} dicht`}
                            type="time"
                            name={`end-${weekday}`}
                            defaultValue={shortTime(row?.end_time ?? null) || "18:00"}
                            className={timeClassName}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="mt-2">
                  <Button variant="secondary">Openingstijden opslaan</Button>
                </div>
              </form>
            ) : (
              <div className="divide-y divide-[var(--line)]">
                {dayOrder.map((weekday) => {
                  const row = openingMap.get(weekday);
                  return (
                    <div key={weekday} className="flex justify-between gap-4 py-2.5 text-sm">
                      <span>{dayLabels[weekday]}</span>
                      <span className="text-right text-[var(--muted)]">
                        {row?.is_open ? `${shortTime(row.start_time)}–${shortTime(row.end_time)}` : "Gesloten"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="py-8">
          <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <h2 className="font-semibold tracking-[-0.02em]">Booking</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Hoe klanten online boeken.</p>
            </div>
            {owner ? (
              <form action={updateBookingSettings} className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  <span>Slotinterval</span>
                  <select name="slotInterval" defaultValue={booking.slot_interval_minutes} className={selectClassName}>
                    {[5, 10, 15, 20, 30, 60].map((value) => <option key={value} value={value}>{value} min</option>)}
                  </select>
                </label>
                <Field label="Minimaal vooraf boeken (min)" name="minLead" type="number" min={0} defaultValue={booking.min_lead_minutes} required />
                <Field label="Max. dagen vooruit" name="maxDays" type="number" min={1} max={365} defaultValue={booking.max_days_ahead} required />
                <Field label="Annuleringstermijn (uur)" name="cancellationHours" type="number" min={0} defaultValue={booking.cancellation_hours} required />
                <label className="sm:col-span-2 flex min-h-11 items-center gap-3 text-sm">
                  <input type="checkbox" name="allowStaffChoice" defaultChecked={booking.allow_staff_choice} className="h-4 w-4 accent-[var(--accent)]" />
                  Klant mag een specifieke medewerker kiezen
                </label>
                <div className="sm:col-span-2">
                  <Button variant="secondary">Booking opslaan</Button>
                </div>
              </form>
            ) : (
              <p className="text-sm leading-6 text-[var(--muted)]">Bookinginstellingen kunnen alleen door de owner worden aangepast.</p>
            )}
          </div>
        </section>

        <section className="py-8">
          <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <h2 className="font-semibold tracking-[-0.02em]">Publieke booking</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">De link die klanten gebruiken.</p>
            </div>
            <div>
              <a
                href={`/book/${salon.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 max-w-full items-center rounded-[var(--radius-pill)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--foreground)]"
              >
                <span className="truncate">/book/{salon.slug}</span>
                <span className="ml-2 shrink-0">↗</span>
              </a>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <h2 className="font-semibold tracking-[-0.02em]">Account</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Je toegang tot SALON.</p>
            </div>
            <div>
              <p className="break-all text-sm font-medium">{user.email}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{membership.role}</p>
              <form action={signOut} className="mt-5">
                <Button variant="secondary">Uitloggen</Button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
