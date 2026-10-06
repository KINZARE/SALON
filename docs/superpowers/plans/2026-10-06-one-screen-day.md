# ORSIRA One-Screen-Day Implementation Plan

> For agentic workers: use superpowers:executing-plans to implement inline; a fresh reviewer checks the final branch.

**Goal:** Daily salon operations from Today without route changes.
**Architecture:** Server day loader + small client workspace controller + lazy context views + existing booking and move forms. Additive treatment-start timestamp and CAS RPC; existing availability/atomic booking remain unchanged.
**Tech Stack:** Existing Next.js 16, React 19, TypeScript, Supabase, Playwright 1.63.
**Spec:** docs/superpowers/specs/2026-10-06-one-screen-day-design.md

## Global Constraints
- Current KINZARE/SALON main c9b39429c52bc734930b9c3dedc1064c5029bcc6; no rewrite or unrelated PR merge.
- One primary CTA, max three secondary actions, single context, Dutch copy.
- No client scheduling authority, no browser secrets, synthetic QA only.
- Preserve current light ORSIRA tokens and typography.
- Release only exact preview-tested HEAD; exact production SHA and alias evidence required.

## Review Focus
- Stale note/status submissions must reject without overwriting newer work.
- A treatment start must not release protected capacity.
- Fast selection changes must never display another customer's stale response.
- Mobile sheet must trap focus, close with Escape, restore focus and preserve drafts.
- Failed/aborted availability requests must not leave stale selectable slots.

### Task 1: Server state and safety
Files: src/domain/today-actions.ts; src/services/today-context.ts; src/app/api/internal/today/route.ts; supabase/migrations/*one_screen_day.sql; tests/today-actions.test.ts; scripts/one-screen-db-qa.mjs.
Interface: selectCurrentNext(appointments, now), getDailyPrimaryAction(appointment), validateDailyMutation(body), daily_appointment_action(salon,id,action,expected_status,expected_started,note,expected_note).
- [ ] Write domain selection/action/validation tests and DB fixtures first; run expected RED.
- [ ] Add timestamp and CAS RPC reusing transition and note primitives with existing lock ordering. Tenant and role authorization before row access; no payment writes.
- [ ] Add lazy context/catalog/notes/intake endpoint and validated mutations.
- [ ] Run unit and isolated DB regression, role/IDOR/duplicate/conflict checks; commit.

### Task 2: Single daily surface
Files: src/components/workspace/daily/*; src/app/app/today/page.tsx; src/services/today-workspace.ts; src/components/appointments/new-appointment-form.tsx; src/components/appointments/reschedule-form.tsx; tests/e2e/one-screen.spec.mjs.
Interface: DailyWorkspace consumes serializable Today data; forms accept onSaved callback and initial context without altering default routed behavior.
- [ ] Write Playwright route-preserving workday, failure/retry, double click, customer/intake, free gap, break/block and focus tests before UI.
- [ ] Implement composed workspace, responsive context surface, appointment/customer/intake views, create/rebook/move/block flows.
- [ ] Preserve customer/service/staff defaults; load slots via existing API. CAS failures reload server state and keep recoverable input.
- [ ] Run unit/typecheck/lint/build and Playwright; commit.

### Task 3: Verification and release
Files: existing CI workflows, scripts/one-screen-performance.mjs, docs/product/one-screen-day-release.md.
- [ ] Compare current main before/after Today and Calendar bundles/query counts and browser performance.
- [ ] Full regression/concurrency/security, responsive matrix, accessibility, noise pass and exact-head hosted preview.
- [ ] Fresh code review; reproduce/fix blockers with RED→GREEN tests.
- [ ] Recheck remote main and exact tested candidate; merge that HEAD only. Update production guard to approved tested app SHA without application changes; guarded deploy and exact-SHA/alias verification.
- [ ] Production browser smoke and synthetic workday cleanup; final evidence report with actual blocked/passed states.
