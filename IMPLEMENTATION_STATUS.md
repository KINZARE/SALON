# Implementation status

## Implemented in code

- Supabase SSR auth wiring and salon memberships.
- Multi-tenant RLS policies with narrower staff appointment access.
- Transactional onboarding: salon, owner membership, opening hours, first service, first staff profile and schedules.
- Mobile-first Today, Calendar, Customers, Services, Staff, Blocks, Reports and Settings.
- Internal appointment creation and public booking with configurable staff choice / “geen voorkeur”.
- Central availability engine using opening hours, staff schedules, breaks, blocks, appointments, duration and buffer.
- Atomic database booking with authoritative snapshots and PostgreSQL exclusion protection against staff overlap.
- Central status transitions, audit events and atomic rescheduling.
- Payment data boundary where browser state is never financial truth.
- Notification outbox separated from appointment persistence.
- Explicit demo mode remains available only when `SALON_PREVIEW_DEMO_MODE=1`.

## Verification — 2026-10-01

### GitHub / application quality

Verified on GitHub Actions:
- 13/13 tests passing;
- TypeScript typecheck passing;
- ESLint passing;
- Next.js production build passing.

GitHub repository:
- `KINZARE/SALON`
- `main` is the source of truth.

### Supabase Phase 0

Connected Supabase project:
- project: `SALON`
- project ref: `pqozwzakdqtueunictid`
- region: `eu-central-1`
- observed status: `ACTIVE_HEALTHY`

Applied migrations:
- `0001_core.sql`
- `0002_security_hardening.sql`
- `0003_security_advisor_cleanup.sql`

Verified database evidence:
- all public application tables have RLS enabled;
- Supabase Security Advisor: **0 findings** after hardening;
- privileged `SECURITY DEFINER` logic is isolated behind the non-exposed `private` schema;
- public RPC wrappers are `SECURITY INVOKER`;
- `create_appointment_atomic` is executable by `service_role` only;
- rollback integration suite: **14/14 checks passed** for owner/manager/staff tenant isolation, write boundaries, staff appointment scope, snapshots, overlap rejection and adjacent booking boundaries;
- an overlapping active appointment for the same staff member is rejected by PostgreSQL with SQLSTATE `23P01`;
- appointment price snapshots remain unchanged when the service price changes.

Still not claimed:
- a true two-database-connection simultaneous race test has not yet been executed; the database overlap constraint itself is verified;
- DST/timezone integration coverage still needs expansion.

### Vercel preview

The preview deployment now uses the **real Supabase backend**:
- `SALON_PREVIEW_DEMO_MODE=0`;
- real Supabase project URL and publishable key;
- server secret supplied through GitHub Actions only;
- Vercel Deployment Protection remains enabled.

Automated protected-preview smoke checks pass:
- homepage resolves successfully;
- login resolves successfully;
- unauthenticated `/app/today` ends at `/login`;
- unknown public salon returns HTTP 404;
- no demo-mode banner is present;
- no application-error page is detected in the smoke responses.

The deployment workflow is stored in `.github/workflows/vercel-preview.yml` and triggers only from the `preview` branch.

## Remaining before a commercial production launch

- full browser QA on mobile widths (320/375/390/430), tablet and desktop;
- authenticated end-to-end onboarding and owner workflow against the real Supabase project;
- public booking end-to-end with persisted appointment data;
- explicit concurrent two-connection booking race test;
- expanded timezone/DST integration tests;
- notification delivery provider/worker;
- payment provider checkout/webhooks if deposits are included in launch scope;
- production deployment and post-deploy smoke test.

## Intentionally deferred from Core MVP

- advanced POS;
- inventory;
- payroll/HR;
- loyalty/memberships;
- marketplace;
- accounting;
- marketing automation;
- enterprise analytics.
