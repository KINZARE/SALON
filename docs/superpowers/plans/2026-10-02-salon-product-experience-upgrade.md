# SALON Product Experience Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the verified SALON operational workspace into a warmer, richer, faster-to-scan daily salon cockpit, then add confirmations/reminders, secure customer self-service and Smart Booking Links without weakening availability, RLS, concurrency or snapshot guarantees.

**Architecture:** Build on `workspace/operational-core` SHA `f16a8798acef21e53e8f569bc628d3d21219f2e6`. Keep the proven staff-column drag/drop calendar and server-authoritative mutation path, but separate visual semantics from business truth and add a dedicated mobile timeline. Add new customer-facing workflows through isolated server services and hashed expiring tokens; keep appointment persistence and notification delivery decoupled.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind 4, @dnd-kit/core 6.3.1, Supabase/Postgres 17, date-fns/date-fns-tz, Vercel/GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-02-salon-product-experience-upgrade-design.md`

## Global Constraints

- Marketing website is out of scope.
- Do not rewrite the app or replace the existing availability/booking architecture.
- Preserve server-authoritative availability, atomic booking/reschedule, database overlap protection, RLS, multi-tenancy and appointment snapshots.
- Preserve the current one-droppable-target-per-active-staff optimisation unless measured evidence proves it should change.
- Current no-login behavior is development/preview only; do not weaken database policies or expose service secrets.
- No merge to `main` and no production promotion without explicit Commander release decision.
- Mobile 375–430px is primary; final QA also covers 320 / 768 / 1024 / 1440.
- Functional colour only: terracotta brand accent, muted semantic status colours, no rainbow card fills.
- Browser/client state is never availability, payment, notification or authorization truth.
- Use TDD for behavior changes and current browser evidence before completion claims.

## Review Focus

1. **Calendar semantic overload:** staff identity and status must remain distinguishable without assigning competing full-card colours; add browser assertions/screenshots for selected status/staff cases.
2. **Mobile scheduling:** 320–430px must never render the desktop multi-column board as the primary interaction; add viewport-specific QA.
3. **Stale/concurrent appointment moves:** optimistic UI must still roll back on 409/stale state; retain the existing delayed-response regression test.
4. **Token leakage/cross-tenant access:** self-service and Smart Booking Link tokens must be hashed, expiring and salon-bound; add database/API negative tests.
5. **Reminder duplication:** confirmation/reminder jobs must be idempotent and never send twice because a worker retries; add uniqueness/idempotency tests.

---

### Task 1: Establish the semantic workspace design foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/app/layout.tsx`
- Modify: `src/components/app-shell/nav.tsx`
- Create: `src/components/ui/workspace-icon.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/field.tsx`
- Test: `scripts/workspace-browser-qa.mjs`

**Interfaces:**
- Produces: shared CSS variables for brand and semantic tones; `WorkspaceIcon({name,size})`; app-shell/nav primitives used by later tasks.
- Consumes: existing role-based navigation and OperationalSearch.

- [ ] **Step 1: Extend browser QA with foundation assertions**
  - At 320 and 1440 verify no horizontal overflow.
  - Verify desktop navigation has accessible named links and no letter-only glyph buttons.
  - Verify mobile bottom nav remains Today / Calendar / Customers / More.

- [ ] **Step 2: Run the current QA to record RED**
  - Run the branch quality/browser workflow against the new assertions.
  - Expected: fail on current letter-glyph navigation / legacy blue visual selectors.

- [ ] **Step 3: Implement workspace tokens and icon set**
  - Port the approved warm SALON token direction from the Experience branch into the operational baseline.
  - Use local inline SVG icons to avoid a new icon dependency.
  - Keep semantic success/warning/info/danger tokens separate from brand accent.

- [ ] **Step 4: Refactor app shell/navigation**
  - Replace T/C/K/etc. glyphs with semantic icons.
  - Keep role visibility unchanged.
  - Reduce Blocks navigation prominence while retaining route access.
  - Preserve OperationalSearch.

- [ ] **Step 5: Run tests/typecheck/lint/build and browser foundation checks**
  - Expected: all pass.

- [ ] **Step 6: Commit**
  - Commit message: `feat: establish semantic workspace visual system`

---

### Task 2: Centralize appointment and staff visual semantics

**Files:**
- Modify: `src/lib/calendar-ui.ts`
- Create: `src/lib/staff-identity.ts`
- Test: `tests/calendar-ui.test.ts`
- Create: `tests/staff-identity.test.ts`

**Interfaces:**
- Produces:
  - `getStatusMeta(status): {label,tone}`
  - `getAppointmentVisual(status, staffId): {surfaceTone, railTone, statusTone}`
  - `getStaffIdentity(staffId,name): {initials,tone}`
- Consumes: appointment status strings and stable staff IDs.

- [ ] **Step 1: Write failing semantic mapping tests**
  - Confirmed => sage status.
  - Pending => amber.
  - Checked-in => muted blue.
  - Completed => graphite/sage-dark.
  - Cancelled => soft red/muted.
  - No-show => strong warning.
  - Stable staff ID always returns the same subtle identity tone.

- [ ] **Step 2: Run focused tests and confirm failure**

- [ ] **Step 3: Implement semantic mapping**
  - Remove service-name keyword colouring as the primary card meaning.
  - Keep appointment surfaces restrained and use staff rail/dot + status badge.

- [ ] **Step 4: Run focused tests, then full suite**

- [ ] **Step 5: Commit**
  - `feat: add consistent appointment and staff semantics`

---

### Task 3: Build the Today command-centre data model

**Files:**
- Create: `src/domain/day-capacity.ts`
- Create: `src/services/today-workspace.ts`
- Test: `tests/day-capacity.test.ts`

**Interfaces:**
- Produces:
  - `computeStaffGaps(input): StaffGap[]`
  - `getTodayWorkspace(salonId, timezone): TodayWorkspaceData`
- Consumes: opening hours, staff schedules, breaks, blocks and active appointments from existing tables.

- [ ] **Step 1: Write failing pure-domain gap tests**
  - Breaks split availability.
  - Blocks split availability.
  - Active appointments split availability.
  - Cancelled/no-show appointments do not occupy capacity.
  - Adjacent appointments do not create fake gaps.
  - Minimum displayed gap defaults to 30 minutes.
  - DST-local day boundaries are respected by service-level tests.

- [ ] **Step 2: Run focused tests and verify RED**

- [ ] **Step 3: Implement `computeStaffGaps`**
  - Pure Date interval logic; no database concerns.

- [ ] **Step 4: Implement `getTodayWorkspace`**
  - Fetch relevant data in parallel.
  - Return next appointment, summary, staff working today, gaps and attention candidates.
  - Do not duplicate the public availability engine’s booking truth.

- [ ] **Step 5: Run domain + full tests**

- [ ] **Step 6: Commit**
  - `feat: compute operational today capacity`

---

### Task 4: Redesign Today as the operational command centre

**Files:**
- Modify: `src/app/app/today/page.tsx`
- Create: `src/components/workspace/today-summary.tsx`
- Create: `src/components/workspace/today-timeline.tsx`
- Create: `src/components/workspace/attention-list.tsx`
- Create: `src/components/workspace/quick-actions.tsx`
- Test: `scripts/workspace-browser-qa.mjs`

**Interfaces:**
- Consumes: `getTodayWorkspace`, status semantics, existing routes.
- Produces: reusable Today display pieces only; no business mutations.

- [ ] **Step 1: Add failing browser assertions**
  - Next appointment visible when present.
  - Gap text visible when meaningful gaps exist.
  - Quick actions include Appointment and Block time.
  - No empty Attention section when there are no actionable items.

- [ ] **Step 2: Run browser QA and verify RED**

- [ ] **Step 3: Implement command-centre hierarchy**
  - Next;
  - compact summary;
  - gaps;
  - attention;
  - chronological day;
  - restrained quick actions.

- [ ] **Step 4: Verify 320 / 390 / 768 / 1440 and reduced-motion behavior**

- [ ] **Step 5: Commit**
  - `feat: turn Today into a salon command centre`

---

### Task 5: Improve desktop Calendar semantics without regressing drag performance

**Files:**
- Modify: `src/components/workspace/calendar-board.tsx`
- Modify: `src/app/app/calendar/page.tsx`
- Create: `src/components/workspace/current-time-line.tsx`
- Modify: `tests/calendar-drag.test.ts`
- Modify: `scripts/workspace-browser-qa.mjs`

**Interfaces:**
- Consumes: `getAppointmentVisual`, `getStaffIdentity`, existing drag helpers and `/api/internal/move`.
- Produces: desktop/tablet calendar board with clearer semantics.

- [ ] **Step 1: Add regression assertions before refactor**
  - Exactly one drop target per active staff member remains.
  - Optimistic move still occurs before delayed API response.
  - Simulated 409 still rolls back.
  - Staff header identity is visible.
  - Current-day board renders a current-time indicator.

- [ ] **Step 2: Run QA and confirm only new semantic/current-time expectations fail**

- [ ] **Step 3: Refactor AppointmentVisual**
  - Neutral/soft card;
  - staff rail/identity;
  - compact semantic status;
  - clearer time/customer/service hierarchy.

- [ ] **Step 4: Add current-time line and clearer gap/block/break visuals**
  - No extra droppable nodes.

- [ ] **Step 5: Run full tests and browser QA**

- [ ] **Step 6: Commit**
  - `feat: improve calendar scanability and status semantics`

---

### Task 6: Add a dedicated mobile Calendar timeline

**Files:**
- Create: `src/components/workspace/mobile-calendar-timeline.tsx`
- Modify: `src/components/workspace/calendar-board.tsx`
- Modify: `src/app/app/calendar/page.tsx`
- Test: `scripts/workspace-browser-qa.mjs`

**Interfaces:**
- Consumes the same appointments/staff/breaks/blocks/calendar window as desktop.
- Produces a mobile-only vertical timeline; desktop DnD remains unchanged.

- [ ] **Step 1: Add failing viewport assertions**
  - At 320/375/390/430 the mobile timeline is visible.
  - Desktop staff-column board is not the primary visible calendar.
  - No body overflow.
  - Appointment links and explicit Move fallback remain reachable.

- [ ] **Step 2: Run QA and verify RED on current shrunk desktop board**

- [ ] **Step 3: Implement mobile timeline**
  - chronological rows;
  - staff avatar/tone;
  - status;
  - gaps;
  - breaks/blocks;
  - tap appointment;
  - explicit Move action.

- [ ] **Step 4: Verify 320/375/390/430 and 768 boundary**

- [ ] **Step 5: Commit**
  - `feat: add purpose-built mobile calendar timeline`

---

### Task 7: Integrate quick blocking and calendar-first actions

**Files:**
- Modify: `src/app/app/blocks/actions.ts`
- Create: `src/components/workspace/quick-block-form.tsx`
- Modify: `src/app/app/calendar/page.tsx`
- Modify: `src/app/app/blocks/page.tsx`
- Test: `tests/calendar-ui.test.ts`
- Test: browser QA flow

**Interfaces:**
- Consumes existing block mutation rules.
- Produces calendar-prefilled block creation by date/staff/time.

- [ ] **Step 1: Add failing tests for prefilled block parameters and invalid ranges**
- [ ] **Step 2: Implement calendar-first block flow**
- [ ] **Step 3: Keep standalone Blocks route as secondary management**
- [ ] **Step 4: Browser-test block creation and reflected calendar state**
- [ ] **Step 5: Commit**
  - `feat: make blocking time a calendar-first action`

---

### Task 8: Upgrade Appointment and Customer operational detail

**Files:**
- Modify: `src/app/app/appointments/[id]/page.tsx`
- Modify: `src/app/app/customers/[id]/page.tsx`
- Create: `src/components/ui/status-chip.tsx`
- Create: `src/components/workspace/customer-risk-note.tsx`
- Test: `scripts/workspace-browser-qa.mjs`

**Interfaces:**
- Consumes existing transition/reschedule/customer actions.
- Produces consistent appointment status and customer history presentation.

- [ ] **Step 1: Add browser assertions for hierarchical primary actions and status semantics**
- [ ] **Step 2: Implement appointment action-centre layout**
- [ ] **Step 3: Implement customer next/last visit, no-show/cancellation summary and quick rebook entry**
- [ ] **Step 4: Verify staff role still cannot access prohibited customer data**
- [ ] **Step 5: Commit**
  - `feat: improve appointment and customer action centres`

---

### Task 9: Upgrade Staff and Services management UX

**Files:**
- Modify: `src/app/app/staff/page.tsx`
- Modify: `src/app/app/services/page.tsx`
- Modify: `src/app/app/staff/actions.ts`
- Modify: `src/app/app/services/actions.ts`
- Create: `src/components/workspace/staff-editor.tsx`
- Create: `src/components/workspace/service-editor.tsx`
- Test: existing + new browser flows

**Interfaces:**
- Consumes existing `save_workspace_entity` RPC and current schedules/breaks/service links.
- Produces clearer people/service management without changing snapshots.

- [ ] **Step 1: Add regression tests for create/edit/deactivate and snapshot preservation**
- [ ] **Step 2: Refactor dense inline forms into focused editor sections**
- [ ] **Step 3: Add staff identity/avatar tone and clearer weekly schedule controls**
- [ ] **Step 4: Keep service name/duration/price/buffer/description/online/staff/active fully editable**
- [ ] **Step 5: Browser-test real persistence**
- [ ] **Step 6: Commit**
  - `feat: polish staff and service management`

---

### Task 10: Align Search, Reports, Settings and More with the new hierarchy

**Files:**
- Modify: `src/app/app/search/page.tsx`
- Modify: `src/components/app-shell/operational-search.tsx`
- Modify: `src/app/app/reports/page.tsx`
- Modify: `src/app/app/settings/page.tsx`
- Modify: `src/app/app/more/page.tsx`
- Test: browser QA

**Interfaces:**
- No new business truth; presentation/refinement only.

- [ ] **Step 1: Add browser checks for search result groups and settings/report accessibility**
- [ ] **Step 2: Apply semantic visual system and reduce card/list clutter**
- [ ] **Step 3: Keep Reports secondary and factual**
- [ ] **Step 4: Run full quality/browser QA**
- [ ] **Step 5: Commit**
  - `feat: align secondary workspace screens`

---

### Task 11: Clean current Supabase performance warnings that affect CORE paths

**Files:**
- Create via Supabase CLI: a migration generated for performance/RLS cleanup
- Modify: `supabase/tests/workspace-integration.sql`

**Interfaces:**
- Consumes current schema/RLS.
- Produces covering indexes and safe init-plan improvement only where justified.

- [ ] **Step 1: Fetch current Supabase changelog/docs for RLS/index guidance**
- [ ] **Step 2: Add SQL assertions for unchanged tenant/role behavior**
- [ ] **Step 3: Add missing high-value FK indexes for Calendar/appointment/customer/notification paths**
- [ ] **Step 4: Fix `customers_assigned_staff_select` auth init-plan using `(select auth.uid())` where semantically equivalent**
- [ ] **Step 5: Run integration SQL + Security Advisor + Performance Advisor**
- [ ] **Step 6: Do not remove unused indexes solely because the fresh test database has not used them**
- [ ] **Step 7: Commit**
  - `perf: harden workspace query and rls performance`

---

### Task 12: Make notification jobs idempotent and schedule reminders

**Files:**
- Create via Supabase CLI: notification scheduling migration
- Create: `src/services/notifications.ts`
- Create: `src/services/email-provider.ts`
- Create: `src/app/api/cron/notifications/route.ts`
- Create/Modify: `vercel.json`
- Modify: booking/reschedule transaction functions only if required to enqueue reminder lifecycle correctly
- Test: `tests/notifications.test.ts`
- Modify: `supabase/tests/workspace-integration.sql`

**Interfaces:**
- Produces:
  - `claimDueNotificationJobs(limit)`
  - `markNotificationSent(id)`
  - `markNotificationFailed(id,error)`
  - email provider abstraction
- Consumes existing `notification_jobs`.

- [ ] **Step 1: Write failing tests for confirmation + 24h reminder scheduling and retry idempotency**
- [ ] **Step 2: Add database uniqueness/idempotency rule for appointment/kind/channel as appropriate**
- [ ] **Step 3: Implement reminder scheduling without coupling send delivery to booking transactions**
- [ ] **Step 4: Implement worker route with bounded batch, retries and no duplicate sends**
- [ ] **Step 5: Wire email provider only after required external credential/integration is authorized; otherwise keep provider boundary testable without claiming real delivery**
- [ ] **Step 6: Verify Security Advisor and integration tests**
- [ ] **Step 7: Commit**
  - `feat: add reliable confirmations and reminders pipeline`

---

### Task 13: Add secure customer self-service appointment links

**Files:**
- Create via Supabase CLI: self-service token migration
- Create: `src/domain/secure-token.ts`
- Create: `src/services/customer-self-service.ts`
- Create: `src/app/manage/[token]/page.tsx`
- Create: `src/app/manage/[token]/actions.ts`
- Test: `tests/secure-token.test.ts`
- Modify: `supabase/tests/workspace-integration.sql`

**Interfaces:**
- Produces:
  - cryptographically random public token;
  - only token hash stored;
  - `getSelfServiceAppointment(token)`;
  - server-side reschedule/cancel operations.
- Consumes existing availability/reschedule/cancellation rules.

- [ ] **Step 1: Write failing token tests**
  - same token hashes deterministically;
  - raw token not stored;
  - expired token rejected;
  - wrong token rejected;
  - cross-salon mutation impossible.

- [ ] **Step 2: Add token schema with expiry/revocation**
- [ ] **Step 3: Implement read-only appointment view**
- [ ] **Step 4: Implement reschedule with authoritative availability**
- [ ] **Step 5: Implement cancel respecting salon cancellation rule**
- [ ] **Step 6: Audit mutation events**
- [ ] **Step 7: Browser-test no-account flow**
- [ ] **Step 8: Commit**
  - `feat: add secure customer appointment self service`

---

### Task 14: Add Smart Booking Links

**Files:**
- Create via Supabase CLI: smart-link migration
- Create: `src/services/smart-booking-links.ts`
- Create: `src/app/app/booking-links/page.tsx`
- Create: `src/app/app/booking-links/actions.ts`
- Create: `src/app/book-link/[token]/page.tsx`
- Reuse/modify: `src/components/booking/booking-flow.tsx`
- Test: `tests/smart-booking-links.test.ts`
- Modify: `supabase/tests/workspace-integration.sql`

**Interfaces:**
- Produces constrained link context: salon, service, optional staff/no preference, date/window, expiry.
- Consumes existing public availability engine and atomic booking.

- [ ] **Step 1: Write failing token/context tests**
  - expired links reject;
  - wrong service/staff pair rejects;
  - no-preference returns only eligible staff availability;
  - link never exposes unrelated salon data.

- [ ] **Step 2: Add hashed expiring booking-link schema**
- [ ] **Step 3: Build owner create/share flow**
- [ ] **Step 4: Build customer constrained availability page**
- [ ] **Step 5: Complete booking through existing atomic path**
- [ ] **Step 6: Add Web Share / WhatsApp deep-link action without requiring WhatsApp Business API**
- [ ] **Step 7: Browser-test owner → link → customer → persisted appointment**
- [ ] **Step 8: Commit**
  - `feat: add smart booking links`

---

### Task 15: Add practical no-show protection and deposit configuration boundary

**Files:**
- Modify: `src/app/app/settings/page.tsx`
- Modify: `src/app/app/services/page.tsx`
- Modify: service/settings actions
- Create via Supabase CLI: only schema changes required for fixed/percentage/full deposit config beyond current `payment_mode` + `deposit_cents`
- Test: service/settings tests and integration SQL

**Interfaces:**
- Consumes existing payment boundary and statuses.
- Produces configuration only until a real payment provider/webhook is authorized.

- [ ] **Step 1: Write failing config validation tests**
- [ ] **Step 2: Expose cancellation/no-show protection settings cleanly**
- [ ] **Step 3: Support none/fixed/full with current schema; add percentage field only if included in this release**
- [ ] **Step 4: Never mark payments paid from browser state**
- [ ] **Step 5: If payment provider is not connected, do not claim payment collection is live**
- [ ] **Step 6: Commit**
  - `feat: add no show and deposit configuration`

---

### Task 16: Add simple waitlist / Fill the Gap

**Files:**
- Create via Supabase CLI: waitlist migration
- Create: `src/services/waitlist.ts`
- Create: `src/app/app/waitlist/page.tsx`
- Modify: Today attention layer
- Modify: public booking empty-availability state
- Test: `tests/waitlist.test.ts`
- Modify: integration SQL

**Interfaces:**
- Produces waitlist entries with service, optional staff preference, date/window, customer contact and status.
- Consumes availability engine for matching.

- [ ] **Step 1: Write failing match tests**
- [ ] **Step 2: Add simple waitlist schema/RLS**
- [ ] **Step 3: Let customer join when no suitable slot exists**
- [ ] **Step 4: Surface relevant matches after cancellations/free capacity**
- [ ] **Step 5: Add owner “send free slot” action through notification boundary**
- [ ] **Step 6: Keep automatic first-come booking out of this slice**
- [ ] **Step 7: Commit**
  - `feat: add simple waitlist gap recovery`

---

### Task 17: Expand full-story browser and responsive verification

**Files:**
- Modify: `scripts/workspace-browser-qa.mjs`
- Modify: `.github/workflows/vercel-preview.yml` or branch-specific preview workflow as needed
- Add QA artifacts/screenshots only through workflow output

**Interfaces:**
- Consumes all completed slices.
- Produces exact evidence for the release candidate SHA.

- [ ] **Step 1: Expand viewport matrix**
  - 320 / 375 / 390 / 430 / 768 / 1024 / 1440.

- [ ] **Step 2: Verify core workspace routes**
  - Today;
  - Calendar;
  - appointment detail;
  - Customers;
  - Services;
  - Staff;
  - Settings;
  - Reports;
  - public booking;
  - self-service if completed;
  - Smart Booking Link if completed;
  - waitlist if completed.

- [ ] **Step 3: Verify interactions**
  - optimistic desktop drag;
  - 409 rollback;
  - mobile move fallback;
  - quick block;
  - staff/service persistence;
  - Smart Booking Link persistence;
  - self-service reschedule/cancel.

- [ ] **Step 4: Capture screenshots at 320/390/768/1440 for Today + Calendar**
- [ ] **Step 5: Assert 0 body overflow, 0 page errors and 0 unexpected console errors**
- [ ] **Step 6: Commit**
  - `test: expand workspace end to end verification`

---

### Task 18: Review, preview deployment and release report

**Files:**
- Modify: `IMPLEMENTATION_STATUS.md`
- Update PR body / release notes

**Interfaces:**
- Produces release candidate evidence only. No production promotion.

- [ ] **Step 1: Run full quality workflow**
  - tests;
  - typecheck;
  - lint;
  - production build.

- [ ] **Step 2: Run Supabase integration tests and advisors**
- [ ] **Step 3: Request code review and resolve only verified findings**
- [ ] **Step 4: Deploy exact branch SHA to Vercel Preview**
- [ ] **Step 5: Run full browser QA against exact deployed SHA**
- [ ] **Step 6: Record**
  - preview URL;
  - exact SHA;
  - test counts;
  - browser viewport matrix;
  - remaining backlog;
  - any external integration still requiring authorization.

- [ ] **Step 7: Stop before main merge/production**
  - Commander/user must explicitly approve release.

## Self-review result

- Spec coverage: all requested CORE product areas, market audit, visual direction, role ownership, verification and out-of-scope rules are represented.
- Scope decomposition: implementation is ordered as independent vertical tasks/slices; server-heavy features are isolated after the UX/core workspace slices.
- Type/interface consistency: new helper/service interfaces are named once and consumed by later tasks.
- Review-focus risks each have an owning test task.
- No task requires weakening current RLS or client-authoritative availability.
