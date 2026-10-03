# ORSIRA App Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the existing SALON operational application to ORSIRA without changing working product behavior, database behavior, authorization, booking logic, or the marketing website.

**Architecture:** Keep the existing Next.js 16 App Router, Supabase, role-aware app shell, workspace components and booking flows intact. Implement ORSIRA as a presentation-layer change: central semantic design tokens and typography first, then shared UI primitives, shell/navigation, core operational screens, secondary surfaces, customer-facing flows, and finally responsive/accessibility/regression QA. Do not introduce a new component framework or new backend contracts.

**Tech Stack:** Next.js 16.3.8, React 19.3, TypeScript 5.9, Tailwind CSS 4.3, Supabase SSR/JS, date-fns, @dnd-kit/core, Node test runner, Playwright browser QA.

**Spec:** `docs/superpowers/specs/2026-10-03-orsira-app-rebrand-design.md`

## Global Constraints

- Work only on `brand/orsira-app-rebrand-20261003`, based on `main@ae0b530a7e142f546609e20a06c81a5cb2b22b34`.
- The marketing website is out of scope; `src/app/page.tsx` must have no diff against the branch base.
- Visible product brand becomes `ORSIRA`; risky internal technical identifiers may remain SALON.
- Dominant background is `#FFFFFF`; optional muted surface is `#FAF7F2`; neutral stone is `#D9D4CC`; foreground is `#2B2B2B`; primary accent is `#7B3F46`; supporting success accent is `#A7B89F`.
- Inter is the default operational UI font. Playfair Display is opt-in and restricted to editorial/brand moments.
- No gradients, glow, glassmorphism, beauty-pink styling, decorative salon symbols, or card-heavy generic SaaS treatment.
- Prefer borders, spacing and typography over shadows; keep rounding restrained.
- Preserve routes, role restrictions, server actions, Supabase queries, RLS, database schema, booking/availability truth, drag/reschedule behavior, reports, CSV, intake, consent, waitlist and self-service behavior.
- Do not add a new calendar engine, booking engine, auth architecture, payment architecture or backend rewrite.
- Mobile is first-class at 320, 375, 390, 430 and 768px plus desktop widths.
- All changed interaction states must retain visible focus, keyboard support, disabled states and reduced-motion behavior.
- Do not merge until tests, typecheck, lint, production build, browser QA and preview smoke tests pass on the exact branch HEAD.

## Review Focus

1. **Very long salon/customer/service names:** must truncate or wrap intentionally without horizontal overflow; covered by Tasks 3, 4 and 5 browser assertions.
2. **Role-dependent navigation:** owner/manager/staff must retain the same available routes and active-state behavior; covered by Task 3 source/browser checks.
3. **Dense calendar data and drag states:** visual changes must not obscure appointment state, drop targets or conflict feedback; covered by Task 4 existing calendar tests plus browser QA.
4. **Recoverable public-booking errors:** rebrand must preserve customer input and server-sourced slot behavior after conflicts/errors; covered by Task 6 booking smoke checks.
5. **Small mobile viewports and safe-area navigation:** no core-flow body overflow or inaccessible bottom navigation at 320–430px; covered by Task 7 viewport matrix.

---

### Task 1: Establish the ORSIRA visual foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `tests/orsira-branding.test.ts`

**Interfaces:**
- Consumes: existing CSS custom-property contract used throughout the app (`--background`, `--surface`, `--foreground`, `--primary`, semantic status tokens).
- Produces: stable ORSIRA semantic tokens; `--font-inter`; `--font-playfair`; `.font-display` opt-in class; ORSIRA root metadata.

- [x] **Step 1: Write failing branding contract tests**
- [x] **Step 2: Run the branding test and verify it fails**
- [x] **Step 3: Implement the central ORSIRA token and typography layer**
- [x] **Step 4: Run branding test, typecheck and build**
- [x] **Step 5: Commit**

### Task 2: Rebrand shared UI primitives without API changes

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/field.tsx`
- Modify: `src/components/ui/empty-state.tsx`
- Modify: `src/components/ui/status-chip.tsx`
- Modify only if required for consistent rendering: `src/components/ui/workspace-icon.tsx`
- Modify: `tests/orsira-branding.test.ts`

**Interfaces:**
- Consumes: ORSIRA semantic CSS variables from Task 1 and all existing primitive props.
- Produces: visually consistent ORSIRA Button, Field/TextAreaField, EmptyState and StatusChip with unchanged public TypeScript APIs.

- [x] **Step 1: Extend the failing UI primitive tests**
- [x] **Step 2: Run the targeted test and verify the new assertions fail**
- [x] **Step 3: Restyle primitives**
- [x] **Step 4: Verify primitive contract and application compile**
- [x] **Step 5: Commit**

### Task 3: Rebrand the app shell and navigation

**Files:**
- Modify: `src/components/app-shell/nav.tsx`
- Modify: `src/components/app-shell/operational-search.tsx`
- Modify: `src/app/app/layout.tsx`
- Modify: `tests/orsira-branding.test.ts`
- Modify later browser assertions in: `scripts/workspace-browser-qa.mjs`

**Interfaces:**
- Consumes: existing `AppNav({ role })`, existing `WorkspaceIcon`, role enum and route arrays.
- Produces: same route/role behavior with ORSIRA wordmark, subdued active treatment, ORSIRA mobile brand label and long-name-safe shell layout.

- [x] **Step 1: Add failing shell-brand tests**
- [x] **Step 2: Run targeted test and verify failure**
- [x] **Step 3: Implement desktop and mobile shell styling**
- [x] **Step 4: Add browser assertions for shell behavior**
- [x] **Step 5: Verify**
- [x] **Step 6: Commit**

### Task 4: Restyle Today and Calendar as ORSIRA core operational surfaces

**Files:**
- Modify: `src/app/app/today/page.tsx`
- Modify: `src/app/app/calendar/page.tsx`
- Modify: `src/components/workspace/today-summary.tsx`
- Modify: `src/components/workspace/today-timeline.tsx`
- Modify: `src/components/workspace/attention-list.tsx`
- Modify: `src/components/workspace/quick-actions.tsx`
- Modify: `src/components/workspace/calendar-board.tsx`
- Modify: `src/components/workspace/calendar-day-view.tsx`
- Modify: `src/components/workspace/calendar-overviews.tsx`
- Modify: `src/components/workspace/calendar-period-view.tsx`
- Modify: `src/components/workspace/desktop-calendar.tsx`
- Modify: `src/components/workspace/mobile-calendar-timeline.tsx`
- Modify: `scripts/workspace-browser-qa.mjs`
- Existing tests: `tests/calendar-drag.test.ts`, `tests/calendar-hours.test.ts`, `tests/calendar-range.test.ts`, `tests/calendar-ui.test.ts`, `tests/day-capacity.test.ts`

**Interfaces:**
- Consumes: unchanged `getTodayWorkspace`, appointment data, calendar query/state, drag/drop callbacks and data attributes used by QA.
- Produces: same operational behavior with lighter hierarchy, restrained appointment colors and first-class mobile layout.

- [x] **Step 1: Record failing visual QA expectations before implementation**
- [x] **Step 2: Rework Today presentation without changing workspace data contract**
- [x] **Step 3: Rework Calendar page controls and day/week/month styling**
- [x] **Step 4: Restyle desktop calendar board without changing drag/drop behavior**
- [x] **Step 5: Restyle mobile day timeline**
- [x] **Step 6: Run calendar regression tests and browser QA**
- [x] **Step 7: Commit**

### Task 5: Rebrand management, reporting and secondary operational surfaces

**Files:**
- Modify: `src/app/app/customers/page.tsx`
- Modify: `src/app/app/customers/[id]/page.tsx`
- Modify: `src/app/app/services/page.tsx`
- Modify: `src/app/app/staff/page.tsx`
- Modify: `src/app/app/reports/page.tsx`
- Modify: `src/app/app/settings/page.tsx`
- Modify: `src/app/app/settings/schedule/page.tsx`
- Modify: `src/app/app/settings/widget/page.tsx`
- Modify: `src/app/app/blocks/page.tsx`
- Modify: `src/app/app/booking-links/page.tsx`
- Modify: `src/app/app/waitlist/page.tsx`
- Modify: `src/app/app/intake/page.tsx`
- Modify: `src/app/app/more/page.tsx`
- Modify: `src/app/app/search/page.tsx`
- Modify relevant editors and supporting components under `src/components/workspace/`.

- [x] **Step 1: Restyle management surfaces**
- [x] **Step 2: Restyle Reports and Settings**
- [x] **Step 3: Restyle appointment and customer action centres**
- [x] **Step 4: Simplify editor surfaces while preserving form contracts**
- [x] **Step 5: Verify server actions, reports, CSV, intake, waitlist and settings behavior through existing tests/browser QA**
- [x] **Step 6: Commit**

### Task 6: Rebrand public booking, smart links, intake and customer self-service

**Files:**
- Modify: `src/app/book/[salonSlug]/page.tsx`
- Modify: `src/app/book-link/[token]/page.tsx`
- Modify: `src/app/embed/[salonSlug]/page.tsx`
- Modify: `src/app/manage/[token]/page.tsx`
- Modify: `src/app/intake/[token]/page.tsx`
- Modify: `src/components/booking/booking-flow.tsx`
- Modify: `src/components/booking/smart-booking-flow.tsx`
- Modify: `src/components/booking/customer-self-service-manager.tsx`
- Modify: `src/components/booking/waitlist-join-form.tsx`

- [x] **Step 1: Add customer-facing ORSIRA presentation contract checks**
- [x] **Step 2: Rebrand public booking and embed shells**
- [x] **Step 3: Rebrand Smart Booking Link flow**
- [x] **Step 4: Rebrand waitlist and self-service controls**
- [x] **Step 5: Preserve booking conflict/retry/state behavior**
- [x] **Step 6: Verify public booking flows in browser QA**
- [x] **Step 7: Commit**

### Task 7: Full responsive, accessibility and regression QA

- [x] **Step 1: Run full test suite**
- [x] **Step 2: Run typecheck**
- [x] **Step 3: Run lint**
- [x] **Step 4: Run production build**
- [x] **Step 5: Run browser QA against production build**
- [x] **Step 6: Verify marketing scope lock (`src/app/page.tsx` unchanged)**
- [x] **Step 7: Verify 320/360/375/390/430/768/1024/1280/1440 viewport sweep with no runtime errors**
- [x] **Step 8: Verify ORSIRA responsive brand checks across representative routes**
- [x] **Step 9: Verify real database read baseline and concurrency regression**
- [x] **Step 10: Commit final QA adjustments**

### Task 8: Verify exact SHA, create preview and open release PR

**Files:**
- No product changes unless preview QA reveals a reproducible regression.
- Existing workflow: `.github/workflows/quality.yml`
- Existing workflow: `.github/workflows/vercel-preview.yml`

**Interfaces:**
- Consumes: exact tested branch HEAD from Task 7.
- Produces: Vercel preview URL, exact tested SHA evidence, green CI and a PR to `main`.

- [x] **Step 1: Record the candidate SHA**
  - `TESTED_SHA=97bd3ec6df33ba44b20da1a4a61a8e4bde6c14e0`
- [x] **Step 2: Push branch and confirm GitHub quality checks**
  - `quality` run #309: tests, typecheck, lint and production build all green on `TESTED_SHA`.
- [x] **Step 3: Create the Vercel Preview from the exact candidate SHA**
  - Preview: `https://salon-hb3wgdu08-kwinphetmanee-2069.vercel.app`
- [x] **Step 4: Smoke-test the preview**
  - Real no-login smoke passed.
  - Full browser QA passed across 14 workspace paths and 9 viewport widths with `runtimeErrors=0`.
  - ORSIRA responsive QA passed 28 route/viewport checks.
  - Live performance measurements completed for 390px and 1440px representative routes.
  - Today → Calendar navigation comparison completed.
- [x] **Step 5: Re-check branch HEAD equality**
  - PR #12 head remains exactly `97bd3ec6df33ba44b20da1a4a61a8e4bde6c14e0`.
- [x] **Step 6: Open PR to `main`**
  - PR #12: `Rebrand SALON app to ORSIRA`.
- [x] **Step 7: Do not merge until review/QA is green**
  - Exact-SHA CI and live preview gates are green.
  - `main` remains `ae0b530a7e142f546609e20a06c81a5cb2b22b34`; branch is 66 commits ahead, 0 behind.
  - Final integration/merge remains a deliberate release decision; no merge performed by this plan update.

## Final verification evidence

Candidate: `97bd3ec6df33ba44b20da1a4a61a8e4bde6c14e0`

Preview: `https://salon-hb3wgdu08-kwinphetmanee-2069.vercel.app`

- Tests: PASS
- Typecheck: PASS
- Lint: PASS
- Production build: PASS
- Real no-login browser QA: PASS
- Responsive matrix: PASS at 320, 360, 375, 390, 430, 768, 1024, 1280 and 1440
- Runtime browser errors: 0
- ORSIRA responsive QA: PASS, 28 route/viewport checks
- Real database baseline comparison: PASS
- Concurrency regression: PASS
- Vercel deployment state: Ready
- Public no-login access: PASS
- Marketing `src/app/page.tsx`: unchanged from base
- Database schema/RLS/business logic: no intentional changes in this rebrand branch
