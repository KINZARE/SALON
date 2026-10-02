# SALON Product Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the highest-value missing workspace features on top of current main without rewriting SALON, then ship one verified preview PR.

**Architecture:** Keep the existing Next.js + Supabase architecture and authoritative booking flow. Add additive tenant-scoped tables/RLS, patch the existing atomic scheduling functions for date exceptions/overrides, keep new admin writes server-side, and expose small focused workspace routes instead of expanding primary navigation.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase/Postgres/RLS, Tailwind, Node test runner, Vercel Preview.

**Spec:** User-supplied SALON PRODUCT COMPLETION EXECUTOR (2026-10-02).

## Global Constraints
- Existing codebase only; no rewrite.
- Marketing website out of scope.
- Preserve current booking/availability/RLS/snapshot/overlap architecture.
- One authoritative availability flow.
- No automatic merge or production promotion.
- Mobile-first and no menu explosion.
- Additive migrations only in this release.

## Review Focus
- Tenant leakage across every new table and server mutation.
- Date exceptions/overrides must not silently invalidate existing future appointments.
- Booking and rescheduling must honor the same exception/override rules under concurrency.
- Public intake links must expose only the requested form/appointment data and never internal notes.
- CSV formula injection and unbounded report queries must be prevented.

---

### Task 1: Domain tests first
- [ ] Add failing tests for week/month ranges.
- [ ] Add failing tests for report range + CSV hardening.
- [ ] Add failing tests for intake form definition validation.

### Task 2: Database completion foundation
- [ ] Add service categories + services.category_id.
- [ ] Add opening exceptions.
- [ ] Add staff date overrides.
- [ ] Add intake forms, fields, service links, secure appointment links, submissions and consents.
- [ ] Add widget settings.
- [ ] Add RLS/indexes/constraints.
- [ ] Add safe schedule mutation RPCs with advisory locks.
- [ ] Patch atomic create/reschedule to honor date exceptions and staff overrides.

### Task 3: Calendar day/week/month
- [ ] Keep existing day board untouched.
- [ ] Add deep-linkable view=day|week|month.
- [ ] Add compact desktop/mobile week and month overview.
- [ ] Month click-through returns to day view.

### Task 4: Service categories
- [ ] Category CRUD/activation/sort controls.
- [ ] Category assignment in service editor.
- [ ] Group service list by category.
- [ ] Public booking category data without adding an unnecessary extra step for small catalogs.

### Task 5: Date schedule management
- [ ] Opening exception UI + conflict-safe server action.
- [ ] Staff override UI + conflict-safe server action.
- [ ] Availability reads both.
- [ ] Booking/reschedule writes enforce both.

### Task 6: Intake forms and consent
- [ ] Form builder with supported field types and required/order.
- [ ] Service linking.
- [ ] Secure no-account appointment form link.
- [ ] Submission stores form version and consent timestamp.
- [ ] Customer profile shows only status, with response detail in authorized route.

### Task 7: Reports and CSV
- [ ] Bounded period selector.
- [ ] Revenue/appointment/completed/average/cancel/no-show/new-returning metrics.
- [ ] Service and staff breakdowns.
- [ ] Server-side CSV export with tenant/role/date checks and formula hardening.

### Task 8: Booking widget
- [ ] Booking link, copyable button HTML and iframe embed code.
- [ ] Restrained label/accent/width/height settings.
- [ ] Public embed uses booking-only data and authoritative availability.

### Task 9: QA and release candidate
- [ ] Expand browser QA for all new routes and responsive widths.
- [ ] Run unit/type/lint/build on exact head.
- [ ] Run database integration + security advisor.
- [ ] Open PR to main.
- [ ] Let PR pipeline deploy exact SHA preview.
- [ ] Verify real preview runtime and core flows.
- [ ] Do not merge or promote production.
