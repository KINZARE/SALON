# ORSIRA Expansion PR A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first additive ORSIRA expansion slice: conditional intake, typed signatures, QR-ready intake links, rebook reminders, feedback jobs and explicit waitlist offers.

**Architecture:** Extend existing intake snapshots, notification outbox and waitlist primitives instead of introducing parallel systems. Keep business rules in small domain helpers, persist only additive schema, and reuse current token, availability and worker boundaries.

**Tech Stack:** Next.js 16, React 19, TypeScript, Zod, Supabase/Postgres, Node test runner, GitHub Actions, Vercel Preview.

**Spec:** `docs/superpowers/specs/2026-10-04-orsira-expansion-pr-a-design.md`

## Global Constraints
- Build from `bd1dbf8d3350a5cbba70dcf1d573e67ddcc40256`.
- Do not merge or promote production in this plan.
- Additive migrations only.
- Preserve tenant isolation, appointment snapshots and overlap protection.
- Reuse `notification_jobs`; no live-delivery claim without provider configuration.
- Waitlist offers never auto-book.

## Review Focus
- A required field whose condition is false must not block submit.
- A condition may not point forward or to itself.
- Missing/invalid consent signature must fail when consent exists.
- Duplicate completion events must not enqueue duplicate rebook/feedback jobs.
- Waitlist offers must expire and never mutate appointment rows by themselves.

---

### Task 1: Conditional intake domain + persistence
**Files:**
- Modify: `src/domain/intake-form.ts`
- Modify: `src/domain/intake-editor.ts`
- Modify: `src/services/intake.ts`
- Modify: `src/app/app/intake/actions.ts`
- Modify: `src/components/workspace/intake-form-editor.tsx`
- Modify: `src/app/intake/[token]/page.tsx`
- Create: `src/components/intake/conditional-intake-form.tsx`
- Create: `supabase/migrations/20261004170000_expansion_pr_a.sql`
- Modify: `tests/intake-form.test.ts`
- Modify: `tests/intake-editor.test.ts`

**Interfaces:**
- Produces `IntakeCondition`, `isIntakeFieldVisible` and conditional-aware `validateIntakeAnswers`.
- Snapshot fields expose optional `condition`.

- [ ] Add failing domain tests for earlier-field conditions, hidden required fields and invalid forward dependencies.
- [ ] Run `npm test` and confirm RED.
- [ ] Implement domain/editor serialization and schema validation.
- [ ] Add additive `condition jsonb` column and update `save_intake_form` validation/insert.
- [ ] Thread condition into snapshots and server validation.
- [ ] Add client public form renderer that hides/shows dependent fields from current answers.
- [ ] Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` and confirm GREEN.

### Task 2: Typed consent signature + QR-ready intake URL
**Files:**
- Modify: `src/services/intake.ts`
- Modify: `src/app/intake/[token]/actions.ts`
- Modify: `src/app/intake/[token]/page.tsx`
- Modify: `src/components/workspace/intake-link-button.tsx`
- Extend: `supabase/migrations/20261004170000_expansion_pr_a.sql`
- Create: `tests/intake-signature.test.ts`

**Interfaces:**
- Public submit accepts `signatureName` when consent statement exists.
- Issued intake token returns canonical `publicPath` suitable as QR payload.

- [ ] Add failing tests for signature normalization/requirement and public path generation.
- [ ] Run tests and confirm RED.
- [ ] Add signature helper and migration columns/updated RPC.
- [ ] Wire signature field into public intake and QR-ready path into workspace link UI.
- [ ] Run full quality commands and confirm GREEN.

### Task 3: Rebook + feedback notification scheduling
**Files:**
- Create: `src/domain/follow-up-jobs.ts`
- Modify: `src/services/notifications.ts`
- Extend: `supabase/migrations/20261004170000_expansion_pr_a.sql`
- Create: `tests/follow-up-jobs.test.ts`

**Interfaces:**
- `buildCompletionFollowUpJobs()` returns idempotent job definitions for rebook and feedback.
- Service-level `rebook_after_days` controls rebook timing; feedback defaults to one day after completion.

- [ ] Add failing timing/idempotency tests.
- [ ] Run tests and confirm RED.
- [ ] Implement pure scheduling helper and additive service configuration.
- [ ] Extend notification scheduling boundary to enqueue jobs once.
- [ ] Run full quality commands and confirm GREEN.

### Task 4: Waitlist offers
**Files:**
- Create: `src/domain/waitlist-offer.ts`
- Modify: `src/services/waitlist.ts`
- Modify: `src/app/app/waitlist/actions.ts`
- Modify: `src/app/app/waitlist/page.tsx`
- Extend: `supabase/migrations/20261004170000_expansion_pr_a.sql`
- Create: `tests/waitlist-offer.test.ts`

**Interfaces:**
- Offer creation validates expiry and range but does not create appointments.
- Existing availability remains final booking authority.

- [ ] Add failing offer validation tests.
- [ ] Run tests and confirm RED.
- [ ] Add tenant-scoped `waitlist_offers` table with RLS and indexes.
- [ ] Add service/action/UI for manual offer creation and status display.
- [ ] Run full quality commands and confirm GREEN.

### Task 5: Final security + browser release gate
**Files:**
- Modify: `tests/e2e/workspace-browser-qa-scenarios.mjs`
- Modify: `IMPLEMENTATION_STATUS.md`

- [ ] Add browser coverage for conditional intake and waitlist offer states.
- [ ] Run GitHub quality workflow on exact PR head.
- [ ] Run Supabase Security Advisor after migration verification.
- [ ] Verify Vercel Preview and browser smoke on mobile + desktop.
- [ ] Update status document with exact SHA and remaining external blockers.
