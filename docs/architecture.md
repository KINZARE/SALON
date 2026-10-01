# Architecture

`Next.js UI → server routes/actions → domain services → Supabase/PostgreSQL`

The central rule is that availability is not owned by React. `src/domain/availability.ts` calculates candidate slots from authoritative intervals, while the booking RPC rechecks schedule/block rules and PostgreSQL provides the final concurrency boundary.

## Main modules

- `src/domain/availability.ts`: pure slot calculation, independently tested.
- `src/services/public-booking.ts`: public read flow and no-preference staff selection.
- `src/services/internal-booking.ts`: authenticated owner/manager booking.
- `supabase/migrations/0001_core.sql`: tenant model, RLS, atomic mutations, audit/outbox and overlap constraint.
- `src/app/book/[salonSlug]`: customer booking UI.
- `src/app/app`: role-aware salon operations UI.

## Payment boundary

The schema supports none/pay-in-salon/deposit/full payment and refunds. Provider integration is deliberately kept behind server/webhook code. Payment state cannot be set as financial truth by the browser.

## Notification boundary

Appointments are committed first. Notification jobs are written to an outbox and can be retried independently. Provider failure therefore never rolls back a valid booking.
