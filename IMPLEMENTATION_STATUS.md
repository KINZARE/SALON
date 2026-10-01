# Implementation status

## Implemented in code

- Supabase SSR auth wiring and tenant memberships.
- RLS policies for salon-scoped data and narrower staff appointment access.
- Transactional onboarding with salon, owner, opening hours, first service, first staff profile and schedule.
- Owner service management and staff creation with service assignments + default schedules.
- Owner booking settings and opening-hours management.
- Owner/manager blocks for salon-wide or staff-specific unavailable time.
- Mobile-first Today, Calendar, Customers, customer history/notes, Services, Staff, Blocks, Reports and Settings.
- Internal appointment creation with existing-customer selection or safe customer creation/deduplication.
- Public booking with configurable staff choice and “geen voorkeur”.
- One pure availability engine for candidate slots, using salon/staff windows, breaks, blocks, appointments, duration and buffer.
- Atomic database booking with authoritative service snapshots and a PostgreSQL exclusion constraint against concurrent overlap.
- Central appointment status transitions, audit events and atomic rescheduling of the same appointment.
- Payment schema/boundary where browser state is never financial truth.
- Notification outbox separated from appointment persistence.

## Verified in this environment

- Pure domain tests: 9 passing.
- All TypeScript/TSX source files parse successfully with the available TypeScript parser.
- No source TODO/FIXME/localStorage/client `paid=true` shortcuts found in the final static scan.
- The migration contains RLS enablement on all tenant-domain tables and the overlap exclusion constraint.

## Not yet verifiable here

The current runtime has no reachable npm registry and no connected Supabase project, GitHub repository or Vercel team/project. Therefore these are **not** claimed as passed yet:

- dependency installation / lockfile;
- full TypeScript typecheck against installed package types;
- ESLint;
- Next.js production build;
- executing the PostgreSQL migration;
- RLS integration tests against a real Supabase database;
- concurrent two-request booking race test against PostgreSQL;
- browser QA at 320/375/390/430/tablet/desktop widths;
- preview deployment and production smoke test.

## Next after connections exist

1. Apply the migration to a Supabase development/preview project.
2. Pull real environment variables and install dependencies.
3. Run typecheck, lint, tests and production build.
4. Add database integration tests for tenant leakage, role permissions, DST and concurrent double booking.
5. Run browser QA for owner onboarding, internal booking, public no-preference booking, reschedule/status flow, blocks and mobile navigation.
6. Only after those pass: create PR, preview deploy, verify exact QA commit SHA, merge, production deploy and smoke-test.

## Intentionally deferred from Core MVP

- payment provider checkout/webhooks;
- notification delivery worker/provider (outbox exists);
- staff invite/account-linking UX;
- WhatsApp/SMS;
- loyalty, memberships, inventory, payroll, marketplace, accounting and advanced analytics.

## Preview preparation — 2026-10-01

- Added an explicit `SALON_PREVIEW_DEMO_MODE=1` path for visual Vercel previews only.
- Preview data is isolated in `src/demo/preview-data.ts`; production Supabase/RLS services remain the default when the flag is off.
- Preview mode is visibly labeled in the authenticated shell and public booking flow and does not claim persistence.
- Internal new-appointment and public-booking flows can complete against ephemeral demo responses and resolve to an appointment detail screen.
- Pure tests: 13 passing (9 existing domain tests + 4 preview-data tests).
- TypeScript/TSX syntax transpile scan: 0 diagnostics.
- Dependency installation, framework-aware typecheck, ESLint and `next build` remain unverified in the current runtime because DNS access to `registry.npmjs.org` fails (`EAI_AGAIN` / timeout).
- Supabase migration/RLS/concurrency remain unverified and are not required for this visual preview mode.
