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

- [ ] **Step 1: Write failing branding contract tests**

In `tests/orsira-branding.test.ts`, add Node tests that read `src/app/globals.css` and `src/app/layout.tsx` and assert:
- `#FFFFFF`, `#FAF7F2`, `#D9D4CC`, `#2B2B2B`, `#7B3F46`, `#A7B89F` are represented in the global token layer;
- legacy `#e7fe55` and `#bfe8ec` brand tokens are absent;
- decorative `radial-gradient` backgrounds are absent from `body`;
- layout imports `Inter` and `Playfair_Display` from `next/font/google`;
- metadata title uses `ORSIRA` and no longer uses `SALON`.

- [ ] **Step 2: Run the branding test and verify it fails**

Run: `node --experimental-strip-types --test tests/orsira-branding.test.ts`
Expected: FAIL on legacy tokens/font/metadata.

- [ ] **Step 3: Implement the central ORSIRA token and typography layer**

Update `src/app/globals.css` to keep existing semantic variable names where possible while changing their values to the ORSIRA palette. Remove body gradients, reduce radius/shadow defaults, define burgundy focus/selection behavior, preserve semantic warning/danger/status contrast, and retain `prefers-reduced-motion`.

Update `src/app/layout.tsx` to load Inter and Playfair Display with `display: "swap"`, expose `--font-inter` and `--font-playfair`, use Inter globally, and change visible metadata to ORSIRA.

- [ ] **Step 4: Run branding test, typecheck and build**

Run:
- `node --experimental-strip-types --test tests/orsira-branding.test.ts`
- `npm run typecheck`
- `npm run build`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx tests/orsira-branding.test.ts
git commit -m "style: establish ORSIRA visual foundation"
```

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

- [ ] **Step 1: Extend the failing UI primitive tests**

Add assertions that shared primitives:
- use semantic ORSIRA variables rather than legacy hardcoded lime/cyan brand colors;
- do not increase control rounding beyond the new restrained control radius;
- retain disabled styling and focus behavior through existing class contracts;
- preserve all existing exported component names and variant names.

- [ ] **Step 2: Run the targeted test and verify the new assertions fail**

Run: `node --experimental-strip-types --test tests/orsira-branding.test.ts`
Expected: FAIL on legacy primitive styling.

- [ ] **Step 3: Restyle primitives**

Keep component signatures unchanged. Make primary actions burgundy with readable white text, secondary/ghost actions light and border-led, danger semantic rather than decorative, fields white with calm burgundy focus treatment, empty states restrained, and status chips low-saturation/readable.

- [ ] **Step 4: Verify primitive contract and application compile**

Run:
- `node --experimental-strip-types --test tests/orsira-branding.test.ts`
- `npm run typecheck`
- `npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui tests/orsira-branding.test.ts
git commit -m "style: align shared UI with ORSIRA"
```

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

- [ ] **Step 1: Add failing shell-brand tests**

Assert source-level contracts:
- `nav.tsx` contains visible `ORSIRA` wordmark and no visible `SALON` wordmark/badge copy;
- `src/app/app/layout.tsx` uses ORSIRA in mobile brand context;
- existing route strings and role branches remain present for Today, Agenda, Customers, Treatments, Team, Reports, Settings and More.

- [ ] **Step 2: Run targeted test and verify failure**

Run: `node --experimental-strip-types --test tests/orsira-branding.test.ts`
Expected: FAIL on SALON shell branding.

- [ ] **Step 3: Implement desktop and mobile shell styling**

Preserve `AppNav` route logic. Replace the circular SALON initial badge with a refined ORSIRA typographic treatment, use quiet active rows with burgundy emphasis instead of dark/bright pills, keep icon weight consistent, simplify footer/help styling, and reduce mobile bottom-nav radius/shadow while preserving safe-area padding and touch targets.

Update `src/app/app/layout.tsx` top context and mobile header to ORSIRA. Keep salon name, public booking link, search permissions and role behavior unchanged.

- [ ] **Step 4: Add browser assertions for shell behavior**

In `scripts/workspace-browser-qa.mjs`, assert desktop and mobile app shell visibly contain `ORSIRA`, primary navigation remains reachable, long salon names do not cause body overflow, and staff/owner role restrictions continue to be covered by the existing QA setup where data permits.

- [ ] **Step 5: Verify**

Run:
- `node --experimental-strip-types --test tests/orsira-branding.test.ts`
- `npm test`
- `npm run typecheck`
- `npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/app-shell src/app/app/layout.tsx scripts/workspace-browser-qa.mjs tests/orsira-branding.test.ts
git commit -m "style: rebrand ORSIRA app shell"
```

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

- [ ] **Step 1: Record failing visual QA expectations before implementation**

Extend browser QA expectations for:
- Today has a light ORSIRA primary surface and no mandatory dark hero panel;
- metrics remain compact and limited;
- Calendar still exposes existing `data-appointment-id`, `data-drop-staff`, `data-mobile-calendar`, `data-desktop-calendar`, week/month markers and current-time line;
- long customer/service labels do not create page-level overflow at 320/390px.

- [ ] **Step 2: Run existing calendar domain/UI tests as the pre-change safety baseline**

Run:
- `node --experimental-strip-types --test tests/calendar-drag.test.ts tests/calendar-hours.test.ts tests/calendar-range.test.ts tests/calendar-ui.test.ts tests/day-capacity.test.ts`

Expected: PASS before visual edits.

- [ ] **Step 3: Restyle Today**

Keep data loading and permissions unchanged. Reduce dark-heavy visual emphasis, keep next appointment obvious using typography/border/accent rather than a near-black hero, keep schedule primary, gaps/attention secondary, and avoid adding extra KPI cards.

- [ ] **Step 4: Restyle Calendar**

Keep all data/drag/reschedule behavior unchanged. Use white/light surfaces, subdued staff/appointment differentiation, visible selected/focus/conflict states, clear staff columns, controlled information density, and dedicated mobile timeline behavior. Preserve existing data attributes and links used by QA.

- [ ] **Step 5: Run calendar regression suite, typecheck and build**

Run:
- `node --experimental-strip-types --test tests/calendar-drag.test.ts tests/calendar-hours.test.ts tests/calendar-range.test.ts tests/calendar-ui.test.ts tests/day-capacity.test.ts`
- `npm run typecheck`
- `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/app/today src/app/app/calendar src/components/workspace scripts/workspace-browser-qa.mjs
git commit -m "style: refine ORSIRA Today and Calendar"
```

### Task 5: Restyle management and secondary operational surfaces

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
- Modify: `src/app/app/more/page.tsx`
- Modify: `src/app/app/search/page.tsx`
- Modify: `src/app/app/intake/page.tsx`
- Modify as needed: `src/components/workspace/service-editor.tsx`
- Modify as needed: `src/components/workspace/staff-editor.tsx`
- Modify as needed: `src/components/workspace/intake-form-editor.tsx`
- Modify as needed: `src/components/workspace/widget-code-block.tsx`
- Modify: `scripts/workspace-browser-qa.mjs`
- Existing tests: `tests/intake-form.test.ts`, `tests/reporting.test.ts`, `tests/staff-identity.test.ts`

**Interfaces:**
- Consumes: existing server actions, field names, list data, report calculations, CSV endpoints, staff identity and schedule configuration.
- Produces: lighter ORSIRA rows/tables/sections with unchanged forms, actions and data contracts.

- [ ] **Step 1: Add browser assertions for management density and overflow**

Cover customers, customer detail, services, staff, reports, settings, blocks, intake and More at 320/390/768/1440 where applicable. Assert no page-level horizontal overflow and that primary headings/actions remain visible.

- [ ] **Step 2: Run management-related existing tests as baseline**

Run: `node --experimental-strip-types --test tests/intake-form.test.ts tests/reporting.test.ts tests/staff-identity.test.ts`
Expected: PASS.

- [ ] **Step 3: Restyle list/detail/configuration screens**

Prefer rows, tables, grouped sections and thin dividers over large card grids. Keep high density where useful. Apply ORSIRA typography, muted surfaces, burgundy primary actions, restrained status color and intentional long-name handling. Do not alter server-action signatures or form field names.

- [ ] **Step 4: Verify management tests, typecheck and lint**

Run:
- `node --experimental-strip-types --test tests/intake-form.test.ts tests/reporting.test.ts tests/staff-identity.test.ts`
- `npm run typecheck`
- `npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/app/customers src/app/app/services src/app/app/staff src/app/app/reports src/app/app/settings src/app/app/blocks src/app/app/more src/app/app/search src/app/app/intake src/components/workspace scripts/workspace-browser-qa.mjs
git commit -m "style: align ORSIRA management surfaces"
```

### Task 6: Rebrand appointment and customer-facing application flows

**Files:**
- Modify: `src/app/app/appointments/[id]/page.tsx`
- Modify: `src/app/app/appointments/[id]/reschedule/page.tsx`
- Modify: `src/app/app/calendar/new/page.tsx`
- Modify: `src/components/appointments/new-appointment-form.tsx`
- Modify: `src/components/appointments/reschedule-form.tsx`
- Modify: `src/app/book/[salonSlug]/page.tsx`
- Modify: `src/components/booking/booking-flow.tsx`
- Modify: `src/app/book-link/[token]/page.tsx`
- Modify: `src/components/booking/smart-booking-flow.tsx`
- Modify: `src/components/booking/waitlist-join-form.tsx`
- Modify: `src/components/booking/customer-self-service-manager.tsx`
- Modify as needed: top-level intake/self-service route presentation under `src/app/intake` and `src/app/manage`
- Modify: `src/app/app/error.tsx`
- Modify: `src/app/app/loading.tsx`
- Modify: `src/app/not-found.tsx`
- Modify: `scripts/workspace-browser-qa.mjs`
- Existing tests: `tests/appointment-status.test.ts`, `tests/availability.test.ts`, `tests/smart-booking-links.test.ts`, `tests/waitlist.test.ts`, `tests/notification-copy.test.ts`

**Interfaces:**
- Consumes: unchanged booking APIs, availability responses, appointment state transitions, smart-link tokens, waitlist contracts and self-service APIs.
- Produces: ORSIRA-branded appointment/customer flows with identical request payloads, route contracts and recoverable states.

- [ ] **Step 1: Run booking/appointment baseline tests**

Run: `node --experimental-strip-types --test tests/appointment-status.test.ts tests/availability.test.ts tests/smart-booking-links.test.ts tests/waitlist.test.ts tests/notification-copy.test.ts`
Expected: PASS.

- [ ] **Step 2: Add browser assertions for error/success/retry states**

Extend `scripts/workspace-browser-qa.mjs` to keep coverage for appointment create/detail/reschedule, public booking, smart booking links, waitlist and self-service. Add ORSIRA-brand presence and ensure recoverable booking conflicts/errors do not drop previously entered customer details where the existing flow exposes this scenario.

- [ ] **Step 3: Restyle appointment and public/customer-facing application flows**

Keep all API calls, payload shapes and state machines intact. Apply the same ORSIRA light surfaces, typography, buttons, form controls, calm processing/success/error states and short human microcopy. Do not add account requirements or duplicate availability logic client-side.

- [ ] **Step 4: Restyle app-level loading/error/not-found states**

Use ORSIRA visual language and concise microcopy while retaining retry/navigation behavior.

- [ ] **Step 5: Verify functional regressions and production compile**

Run:
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app/app/appointments src/app/app/calendar/new src/components/appointments src/app/book src/app/book-link src/components/booking src/app/intake src/app/manage src/app/app/error.tsx src/app/app/loading.tsx src/app/not-found.tsx scripts/workspace-browser-qa.mjs
git commit -m "style: rebrand ORSIRA booking and appointment flows"
```

### Task 7: Complete responsive, accessibility and browser QA

**Files:**
- Modify only when failures prove necessary: files changed in Tasks 1–6
- Modify: `scripts/workspace-browser-qa.mjs`
- Do not modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: finished ORSIRA branch and existing Playwright QA harness.
- Produces: reproducible runtime evidence for responsive layout, accessibility basics and critical flows.

- [ ] **Step 1: Expand the viewport matrix**

Ensure browser QA explicitly exercises 320, 375, 390, 430, 768 and 1440px on representative core screens, with `noBodyOverflow` checks and bottom-nav visibility/desktop-sidebar visibility expectations.

- [ ] **Step 2: Add accessibility/runtime assertions**

Assert visible focus can be reached on primary navigation/actions, critical controls have labels, disabled controls remain non-interactive, there are no captured page/console errors, and reduced-motion CSS remains defined in the global stylesheet test.

- [ ] **Step 3: Run full local quality suite**

Run:
- `npm test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Expected: all green.

- [ ] **Step 4: Run browser QA against a locally served production build**

Run application with the same environment/QA setup used by the repository, then:

`QA_BASE_URL=http://127.0.0.1:3000 node scripts/workspace-browser-qa.mjs`

Expected: PASS with no body-overflow failures, framework overlays or captured runtime errors.

- [ ] **Step 5: Verify marketing scope lock**

Run: `git diff ae0b530a7e142f546609e20a06c81a5cb2b22b34...HEAD -- src/app/page.tsx`
Expected: no output.

Also inspect `git diff --stat ae0b530a7e142f546609e20a06c81a5cb2b22b34...HEAD` and confirm no marketing-only files were changed.

- [ ] **Step 6: Fix only observed regressions, then repeat the affected check and the full quality suite**

Do not broaden scope while fixing QA failures.

- [ ] **Step 7: Commit final QA adjustments**

```bash
git add scripts/workspace-browser-qa.mjs src tests
git commit -m "test: verify ORSIRA rebrand across core flows"
```

### Task 8: Verify exact SHA, create preview and open release PR

**Files:**
- No product changes unless preview QA reveals a reproducible regression.
- Existing workflow: `.github/workflows/quality.yml`
- Existing workflow: `.github/workflows/vercel-preview.yml`

**Interfaces:**
- Consumes: exact tested branch HEAD from Task 7.
- Produces: Vercel preview URL, exact tested SHA evidence, green CI and a PR to `main`.

- [ ] **Step 1: Record the candidate SHA**

Run: `git rev-parse HEAD`
Store as `TESTED_SHA` for the release note/PR body.

- [ ] **Step 2: Push branch and confirm GitHub quality checks**

Push `brand/orsira-app-rebrand-20261003`. Confirm `quality.yml` runs for the same `TESTED_SHA` and tests/typecheck/lint/build are green.

- [ ] **Step 3: Create the Vercel Preview from the exact candidate SHA**

Use the repository's existing `.github/workflows/vercel-preview.yml` or the connected Vercel deployment tool if authorization is available. Do not substitute a preview built from a different commit.

- [ ] **Step 4: Smoke-test the preview**

Run `scripts/workspace-browser-qa.mjs` with `QA_BASE_URL` pointed at the preview URL. Re-check Today, Calendar day/week/month, Customers, Services, Staff, Reports, booking widget/public booking, Smart Booking Links, waitlist and customer self-service; verify 320/390 and desktop representative widths.

- [ ] **Step 5: Re-check branch HEAD equality**

Run: `git rev-parse HEAD`
Expected: exactly equals `TESTED_SHA`.

If any fix was required after Step 1, define a new `TESTED_SHA` and repeat Steps 2–5.

- [ ] **Step 6: Open PR to `main`**

PR title: `Rebrand SALON app to ORSIRA`

PR body must include:
- scope: app-only rebrand;
- exact `TESTED_SHA`;
- confirmation `src/app/page.tsx` is unchanged;
- tests/typecheck/lint/build results;
- browser QA coverage;
- Vercel Preview URL;
- statement that database/RLS/business logic were not intentionally changed.

- [ ] **Step 7: Do not merge until review/QA is green**

Before merge, re-fetch PR head and verify it still equals `TESTED_SHA`. If it moved, repeat relevant verification on the new head.
