# ORSIRA KPI definitions

These definitions describe the metrics shipped in the ORSIRA Product Experience + KPI release. The salon timezone is authoritative for all day and range boundaries. Appointment snapshot fields preserve historical service value; they do not by themselves prove received payment.

## Today

### Afspraken

- **Meaning:** appointments scheduled on the local salon day that were not cancelled.
- **Numerator/source:** `appointments` rows whose local `starts_at` is today and `status != cancelled`.
- **Included:** pending, confirmed, checked_in, completed, no_show.
- **Excluded:** cancelled.
- **Edge case:** no-show still counts as a scheduled appointment; it is separately surfaced as an attention signal.

### Geplande waarde

- **Meaning:** scheduled appointment value for the local salon day, not received cash.
- **Source:** sum of `price_cents_snapshot` for non-cancelled appointments starting today.
- **Included:** pending, confirmed, checked_in, completed, no_show.
- **Excluded:** cancelled.
- **Financial wording:** never presented as paid revenue.

### Bezetting

- **Meaning:** share of offered/bookable staff capacity occupied by appointments.
- **Formula:** `occupiedMinutes / bookableMinutes`.
- **Bookable minutes:** salon opening intersected with the active staff schedule or date override, minus active breaks and blocks.
- **Occupied minutes:** appointment `starts_at` through `occupied_until`, clipped to bookable intervals and merged to avoid double counting.
- **Included occupancy statuses:** pending, confirmed, checked_in, completed, no_show.
- **Excluded occupancy status:** cancelled.
- **Buffers:** included because `occupied_until` is authoritative for blocked capacity.
- **Edge case:** zero bookable minutes returns 0% rather than dividing by zero.

### Vrije capaciteit

- **Formula:** `bookableMinutes - occupiedMinutes`, clamped at zero.
- **Display:** hours/minutes.
- **Difference from free-gap list:** the KPI measures total remaining capacity; the existing gap list continues to show actionable future gaps of at least 30 minutes and keeps its existing operational semantics.

### Aandacht nodig

Count of the existing Today attention items assembled from cancellations, no-shows, large future gaps and eligible waitlist matches. This is an operational queue count, not an AI score.

## Reports

### Afgeronde behandelwaarde

- **Meaning:** historical service snapshot value attached to completed appointments.
- **Formula:** sum `price_cents_snapshot` where `status = completed`.
- **Not equal to:** received payment, accounting revenue or payout amount.

### Geplande waarde

- **Formula:** sum `price_cents_snapshot` for non-cancelled appointments in the selected period.
- **Included:** pending, confirmed, checked_in, completed, no_show.
- **Excluded:** cancelled.

### Afspraken

Count of non-cancelled appointments in the selected period. No-shows remain part of scheduled appointment volume.

### Gemiddelde behandelwaarde

`completedValue / completedCount`, zero-safe. Cancelled and no-show appointments are not part of the denominator.

### Annuleringspercentage

`cancelled / all appointments scheduled in the selected period`, zero-safe.

### No-showpercentage

`no_show / (completed + no_show)`, zero-safe. This denominator represents customers who should have appeared and for whom the outcome is known.

### Nieuwe en terugkerende klanten

A customer is considered in the mix only when the selected period contains a valid appointment status: pending, confirmed, checked_in or completed. The customer is returning when a valid appointment with one of those statuses exists before the selected period. Cancelled and no-show rows do not establish successful visit history.

### Per behandeling / medewerker

- appointment volume excludes cancelled rows;
- completed count/value includes only completed rows;
- value label is **afgeronde waarde**, not revenue.

## Timezone and snapshots

- Report range boundaries are converted from the salon-local date to UTC before querying.
- Today is derived from the salon timezone, never the browser timezone.
- Historical value uses appointment snapshots so later service-price changes do not rewrite history.

## Deferred metrics / data gates

The following remain deliberately unshipped until the existing data model proves the metric without guessing or duplicating business logic:

- **Betaalde omzet:** `payment_status` exists, but this release does not assert that appointment payment status alone is complete accounting/payment truth.
- **Period-wide occupancy:** Today reuses already-loaded opening/schedule/break/block data. A historical-period occupancy report would require safe reuse of authoritative availability primitives across many dates; it is deferred rather than implemented as a divergent analytics engine.
- **Rebooking percentage:** no reliable explicit rebooking relationship was established.
- **Retention percentage:** the previous `terugkeerpercentage` label was removed because returning-customer share in a period is not cohort retention.
- **Waitlist conversion:** no reliable conversion event contract was established for this release.
- **Average days between visits:** deferred until visit-history semantics and cohort rules are product-defined.
- **Revenue forecast:** no forecasting model is introduced.
- **Cancellation recovery / last-minute fill rate:** conversion attribution is not reliable enough yet.
