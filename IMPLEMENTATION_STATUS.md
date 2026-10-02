# SALON implementation status

## Scope of this branch

Branch: `commander/product-experience-upgrade`

This release candidate upgrades the **SALON workspace/backoffice only**. The marketing website is intentionally outside scope.

The implementation builds on the verified `workspace/operational-core` baseline and preserves the existing Supabase/Postgres booking, availability, RLS, snapshot and overlap architecture.

## Product experience implemented

### Workspace foundation

- Warm SALON visual system using near-white surfaces, deep ink and restrained terracotta accent.
- Onest typography.
- Semantic status colours separated from brand colour.
- Real navigation icons instead of letter glyphs.
- Desktop sidebar and mobile bottom navigation.
- Search preserved as an operational shortcut.
- Blocks moved out of primary navigation while remaining accessible.

### Today

Today is now the operational command centre:
- next appointment;
- compact daily summary;
- chronological schedule;
- meaningful free gaps;
- attention items only when actionable;
- quick actions;
- owner/manager waitlist-match attention.

### Calendar

Desktop/tablet:
- staff-column day calendar;
- visual duration;
- stable staff identity;
- semantic appointment status;
- current-time indicator;
- breaks and blocks;
- direct appointment creation;
- drag vertically to change time;
- drag horizontally to change staff;
- optimistic interaction;
- server-authoritative move validation;
- rollback on conflict;
- Undo after successful move.

Mobile:
- dedicated vertical day timeline;
- no squeezed desktop calendar;
- explicit Move fallback;
- appointments, staff, status, breaks and blocks remain readable.

### Appointments and customers

Appointment detail is an action centre with:
- time/date;
- customer;
- service;
- staff;
- price/payment status;
- note;
- human-readable status;
- move, state transition, no-show and cancel actions.

Customer profile includes:
- contact;
- upcoming appointment;
- last visit;
- history;
- cancellation/no-show counts;
- internal note;
- direct rebooking with customer preselected.

### Team and services

Staff management supports:
- create/edit;
- operational role;
- active/inactive;
- service assignment;
- weekly schedules;
- fixed breaks;
- mobile-friendly editor.

Service management supports:
- create/edit;
- duration;
- buffer;
- price;
- description;
- online bookable;
- active/inactive;
- staff assignment;
- no-show/deposit configuration.

Historical appointment snapshots remain protected when services change.

### Secondary workspace

Updated and aligned:
- Search;
- Reports;
- Settings;
- More;
- Blocks.

Reports remains intentionally secondary and operational rather than becoming a BI dashboard.

## Commercial workflow foundation

### Confirmations and reminders

The existing `notification_jobs` outbox is reused.

Implemented:
- idempotent booking confirmation jobs;
- idempotent 24-hour reminder jobs;
- reminder rescheduling/cancellation when appointment state changes;
- atomic worker claiming with `FOR UPDATE SKIP LOCKED`;
- stale worker recovery;
- bounded retry/backoff;
- terminal failed state;
- provider abstraction;
- Resend-compatible idempotent send worker;
- authenticated cron endpoint guarded by `CRON_SECRET`.

**Not yet live delivery:** the connected Resend account currently has no verified sending domain and no sending API key. The worker fails before claiming jobs when provider configuration is absent, so queued work is not lost.

### Customer self-service

Implemented secure no-account appointment links:
- cryptographically random public token;
- SHA-256 token hash stored in database, never the raw token;
- expiry and revocation;
- appointment view;
- availability lookup;
- reschedule;
- cancel;
- salon cancellation cutoff;
- server-side staff/service/opening-hours/schedule/break/block validation;
- PostgreSQL overlap constraint remains the final concurrency guard;
- service-role-only mutation RPCs.

### Smart Booking Links

Implemented:
- owner/manager link creation;
- service constraint;
- optional staff or no preference;
- bounded date window;
- expiring hash-only token;
- constrained customer availability;
- booking through the existing atomic public booking path;
- WhatsApp/Web Share-ready public URL flow.

### No-show / deposit configuration

Implemented per service:
- pay in salon;
- fixed deposit;
- full payment.

The service save path is transactional and rejects a fixed deposit that is zero/negative or exceeds the service price.

**Payment collection itself is not claimed live.** A real payment provider/webhook is still required before a browser or booking flow can collect/confirm payments.

### Waitlist / Fill the Gap

Implemented:
- public waitlist join when a selected booking day has no suitable slots;
- service/date/contact capture;
- optional preferred staff;
- server-only table access;
- owner/manager waitlist workspace;
- call/email/contacted controls;
- matching only when service duration + buffer fits a real free gap and staff is eligible;
- Today attention when a waiting customer matches current free capacity.

No automatic booking is performed.

## Database and security

Supabase project:
- project: `SALON`
- ref: `pqozwzakdqtueunictid`
- region: `eu-central-1`

New migrations in this upgrade include:
- workspace performance hardening;
- notification reminders;
- atomic notification worker claiming;
- self-service token storage and actions;
- notification terminal states;
- Smart Booking Links;
- transactional service payment policy;
- waitlist;
- explicit public-workflow deny policies and FK indexes.

Latest database integration rollback suite verifies:
- owner/manager CRUD;
- tenant isolation;
- staff scope;
- appointment overlap rejection;
- adjacent booking boundary;
- snapshot preservation;
- deposit policy;
- stale appointment move rejection;
- block protection;
- status transitions;
- notification claim privilege;
- server-only access for self-service tokens, Smart Booking Links and waitlist.

Result: **PASS**.

Supabase Security Advisor after current hardening: **0 findings**.

Remaining Performance Advisor items are older INFO/WARN findings such as unused indexes, some non-core missing FK indexes and existing multiple permissive authenticated RLS policies. They are not being broadly rewritten in this release because doing so would increase authorization regression risk.

## Application verification

Verified release candidate before this status-only documentation update:

- SHA: `f3d77b5fb6a246b0665d6e89b5a5c27079af2967`
- unit/domain tests: **46/46 passed**
- TypeScript: passed
- ESLint: **0 errors, 2 warnings**
- Next.js production build: passed
- browser QA: passed
- browser runtime errors: 0
- Vercel deployment: Ready
- public no-login smoke test: passed

Browser responsive matrix:
- 320
- 375
- 390
- 430
- 768
- 1024
- 1440

Browser QA covers:
- Today;
- Calendar;
- Customers;
- Staff;
- Services;
- Blocks;
- Settings;
- Reports;
- Booking Links;
- Waitlist;
- More;
- public booking;
- optimistic calendar drag;
- conflict rollback;
- appointment detail;
- customer profile;
- real settings persistence;
- no body overflow;
- no legacy demo/login content.

QA screenshots are captured for Today and Calendar at 320 / 390 / 768 / 1440.

Verified preview for the above candidate:
`https://salon-icq56js6s-kwinphetmanee-2069.vercel.app`

A fresh exact-SHA pipeline must still run after this documentation commit before the branch is treated as the final release candidate.

## Current external blockers before commercial production

1. **Transactional email delivery**
   - Resend connector is connected.
   - No verified Resend sending domain exists yet.
   - No sending API key/runtime env is configured yet.
   - No production-safe scheduler cadence has been selected for the current Vercel plan.
   - Therefore confirmations/reminders are queued and worker-ready, but real outbound email is not claimed live.

2. **Payment collection**
   - Deposit/full-payment configuration exists.
   - Existing payment boundary remains server-owned.
   - A real payment provider, checkout and webhook verification are still required before payment collection is live.

3. **Authentication**
   - Current preview intentionally operates in temporary no-login development mode.
   - Production authentication architecture has not been removed.
   - Login must be restored before real private salon/customer production use.

## Intentionally not built

- inventory suite;
- payroll/HR;
- advanced POS;
- accounting;
- marketplace;
- loyalty/memberships;
- franchise management;
- enterprise BI;
- broad marketing automation.

## Release rule

Do not merge to `main` or promote production solely from this document.

The final release decision requires:
- green exact-head quality checks;
- green exact-head browser QA;
- exact-head Vercel Preview;
- explicit Commander/user approval.
