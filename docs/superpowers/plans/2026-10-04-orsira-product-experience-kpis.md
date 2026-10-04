# ORSIRA Product Experience + KPI Execution Plan

**Base SHA:** `41d09fb3c0c958a777bfd8d7602a859b2076ee14`

**Branch:** `experience/orsira-kpi-cockpit`

**Goal:** Improve ORSIRA Today and Reports with reliable operational KPI semantics and small Calendar clarity improvements, while preserving existing booking, availability, Supabase, RLS, concurrency and no-login release architecture.

**Binding spec:** uploaded `ORSIRA_PRODUCT_EXPERIENCE_KPI_EXECUTOR(1).md` supplied by the product owner on 2026-10-04.

## Guardrails

- No rewrite.
- No booking/availability engine replacement.
- Server/database remains authoritative.
- Do not label snapshot appointment value as paid revenue.
- Keep the current mobile timeline and desktop dnd-kit calendar architecture.
- No new chart dependency unless existing primitives cannot serve the information clearly.
- Use current ORSIRA design tokens; keep UI light, calm and mobile-first.
- Tests before production behavior changes.
- Merge/production only from an exact green head SHA.

## Audit snapshot

### KEEP
- Current Today command-centre hierarchy, next appointment, timeline, attention list and free-gap list.
- Existing `computeStaffGaps` and server-side `getTodayWorkspace` architecture.
- Current desktop dnd-kit calendar and dedicated mobile timeline.
- Reports period selector, CSV export, staff/service breakdowns and tenant-scoped server queries.
- Current ORSIRA visual system and responsive shell.

### IMPROVE
- Correct Today appointment/planned-value status semantics.
- Add reliable bookable/occupied/free-capacity metrics and occupancy percentage.
- Make Today KPI zone 4–5 quiet, decision-useful metrics.
- Rename completed snapshot value away from misleading revenue language.
- Add cancellation/no-show rates with explicit denominators.
- Correct new-vs-returning customer semantics to first valid historical appointment.
- Add one restrained trend section without a heavy chart dependency if the current data shape supports it cleanly.
- Rename Calendar heading to Dutch `Agenda` and make only small scanability/copy changes.

### REMOVE
- `omzet afgerond` wording for appointment snapshot value.
- `terugkeerpercentage` wording where the current calculation is only the share of returning customers in the period, not retention/rebooking.

### DO NOT TOUCH
- AvailabilityService/domain booking rules.
- Atomic booking/rescheduling and overlap protection.
- Opening hours/exceptions, staff schedules/overrides, breaks, blocks and buffers as business truth.
- Smart Booking Links, customer self-service and notification lifecycle.
- RLS / tenant isolation / timezone primitives.

## KPI definitions for this release

### Afspraken vandaag
Count appointments starting on the local salon day where status is not `cancelled`. `no_show` remains an appointment that was scheduled for that day.

### Geplande waarde
Sum `price_cents_snapshot` for appointments starting in the selected day/period where status is not `cancelled`. This is appointment value, not received cash.

### Afgeronde behandelwaarde
Sum `price_cents_snapshot` for `completed` appointments in the selected period.

### Gemiddelde behandelwaarde
`completedValue / completedCount`, zero-safe.

### Annuleringspercentage
`cancelled / all appointments scheduled in period`, zero-safe.

### No-showpercentage
`no_show / (completed + no_show)`, zero-safe.

### Nieuwe vs terugkerende klanten
A customer is new when their first valid appointment is in the selected period. For this release, valid customer-history statuses are `pending`, `confirmed`, `checked_in`, `completed`; `cancelled` and `no_show` do not establish a successful visit history.

### Bezetting vandaag
Schedule-capacity utilization, using the same time intervals already used by Today capacity: salon opening intersected with active staff schedule/override, minus breaks and blocks for offered/bookable minutes. Occupied minutes use appointment `occupied_until` (so buffer time is included) for `pending`, `confirmed`, `checked_in`, `completed` and `no_show`; `cancelled` never occupies. Appointment occupancy is clipped to offered intervals and merged to avoid double counting. A no-show remains booked capacity that was unavailable to others, so it counts in schedule utilization while remaining separately visible as a no-show quality metric.

### Vrije capaciteit vandaag
`bookableMinutes - occupiedMinutes`, clamped at zero; display as hours/minutes plus context.

## Task 1 — Pure KPI/capacity domain (TDD)

**Create:** `src/domain/operational-kpis.ts`

**Create:** `tests/operational-kpis.test.ts`

RED tests first for:
- appointments today includes no-show but excludes cancelled;
- planned value includes no-show but excludes cancelled;
- completed value and average;
- cancellation rate;
- no-show rate denominator;
- zero denominators;
- bookable capacity subtracts breaks/blocks;
- occupied capacity uses `occupied_until` and buffers;
- cancelled does not occupy;
- no-show does occupy schedule capacity;
- overlapping intervals do not double count;
- clipping to working/bookable windows.

Then implement the minimum pure functions and run the full suite.

## Task 2 — Today server data and UI

**Modify:** `src/services/today-workspace.ts`

**Modify:** `src/components/workspace/today-summary.tsx`

**Modify:** `src/app/app/today/page.tsx`

- Reuse current schedule/opening/break/block/appointment reads; do not add client KPI calculations.
- Return appointment count, planned value, bookable minutes, occupied minutes, free minutes, occupancy percent and attention count.
- Keep existing free-gap list and next appointment behavior.
- Show 4–5 quiet metrics on owner/manager Today: Afspraken, Geplande waarde, Bezetting, Vrije capaciteit, Aandacht nodig.
- Staff view may suppress financial value while retaining operational metrics.
- Keep mobile vertical readability; no horizontal KPI carousel.

## Task 3 — Reports semantics and management insight (TDD)

**Modify:** `src/services/reports.ts`

**Modify:** `tests/reporting.test.ts`

**Modify:** `src/app/app/reports/page.tsx`

- Rename internal financial summary to completed treatment value.
- Add planned value, cancellation rate and no-show rate.
- Historical customer lookup only considers valid appointment statuses.
- Rename/remove misleading retention language.
- Core metrics limited to 4–6.
- Keep staff/service breakdowns, but label completed treatment value explicitly.
- Add at most one compact appointment-volume trend and one completed-value trend using existing server data and lightweight accessible markup; no chart package.
- If reliable period-wide occupancy would require duplicated availability logic or N+1 schedule reconstruction, defer it explicitly rather than fake it.

## Task 4 — Calendar clarity

**Modify:** `src/app/app/calendar/page.tsx`

- Rename page heading to `Agenda`.
- Preserve Day/Week/Month, mobile timeline, desktop DnD and all move/rollback behavior.
- No calendar engine rewrite.

## Task 5 — KPI documentation + browser assertions

**Create:** `docs/product/orsira-kpi-definitions.md`

**Modify as needed:** existing Playwright/browser QA specs only after inspecting current selectors.

- Document definitions, source fields, included statuses, timezone and edge cases.
- Verify Today/Reports/Agenda at 390 and 1440, plus existing responsive suite.
- Verify no horizontal overflow and no runtime console errors.

## Task 6 — Release gates

Run exact-head gates through GitHub Actions / existing workflows:

1. `npm test`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`
5. real database browser QA
6. performance query comparison
7. concurrency regression
8. responsive Playwright QA
9. preview deployment READY
10. live preview exact-SHA verification

Then review the PR specifically for KPI semantics, timezone, duplicated availability logic, tenant leakage, performance and mobile overflow.

Only if the exact head remains green: merge to `main`, allow guarded production workflow to deploy that exact main SHA, and smoke-test Today / Agenda / Reports / Public Booking plus direct KPI spot-checks against Supabase.

## Deferred unless existing data proves them cleanly

- paid revenue as an accounting truth;
- rebooking percentage;
- retention percentage;
- waitlist conversion;
- average days between visits;
- revenue forecast;
- cancellation recovery;
- period-wide occupancy if it cannot reuse existing domain primitives without duplicated availability logic.
