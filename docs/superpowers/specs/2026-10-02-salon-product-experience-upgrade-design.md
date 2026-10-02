# SALON Product Experience Upgrade — Design Specification

**Date:** 2026-10-02  
**Status:** Approved product brief, execution baseline established  
**Source:** User-provided “SALON — PRODUCT EXPERIENCE UPGRADE / VISUAL RICHNESS + OPERATIONAL FEATURE GAP + END-TO-END EXECUTION” brief.  
**Scope:** SALON workspace/app only. Marketing website is explicitly out of scope.

## 1. Goal

Turn SALON into a calm, premium, visually richer and operationally complete workspace for small appointment-driven salons. The product must remain minimal, mobile-first and easy to scan while adding functional colour, clearer hierarchy and the missing daily workflows that reduce planning friction.

The target experience is a **quiet premium cockpit for a small salon**:
- not empty;
- not visually flat;
- not noisy;
- not a generic blue SaaS dashboard;
- not feature-bloated.

A salon owner should understand the current day within seconds and complete common actions in a few taps.

## 2. Current verified baseline

### Source branch

The correct implementation baseline is:

- branch: `workspace/operational-core`
- SHA: `f16a8798acef21e53e8f569bc628d3d21219f2e6`
- PR: #4 “Complete operational workspace recovery”
- base: `main`
- mergeability observed: mergeable
- production: not promoted/merged automatically

This baseline supersedes `experience/premium-redesign` as the technical starting point because PR #4 contains the current operational recovery, real Supabase no-login runtime, drag/drop calendar, staff/service management, search, database migrations and current QA.

PR #3 remains a visual reference only. It must **not** be merged wholesale because it also modifies the marketing website, which is out of scope.

### Verified baseline quality

Latest exact PR #4 head evidence observed:

- GitHub quality workflow: success
- 27/27 tests: pass
- TypeScript: pass
- ESLint: pass with two pre-existing warnings reported in the PR
- Next.js production build: pass
- real-no-login browser QA: success
- Vercel preview deployment: Ready
- current tested widths: 320 / 390 / 768 / 1440
- current workspace routes tested: 8
- runtime errors in browser QA: 0
- optimistic calendar drag is verified
- simulated 409 conflict rollback is verified

Current public preview from PR #4:

`https://salon-pyovjqok7-kwinphetmanee-2069.vercel.app`

### Supabase

Connected project:

- name: SALON
- project ref: `pqozwzakdqtueunictid`
- region: `eu-central-1`
- status observed: `ACTIVE_HEALTHY`

Current database contains real seeded workspace data for product testing:
- 1 salon
- 7 services
- 5 staff
- 14 customers
- 20 appointments
- schedules, breaks, blocks and notification jobs

Security Advisor observed: **0 findings**.

Performance Advisor currently reports informational/warning findings including missing covering indexes, one RLS init-plan warning and multiple permissive RLS policy warnings. These are performance/maintainability follow-ups; they are not a reason to weaken RLS.

## 3. Visual audit of the current operational baseline

The existing operational implementation is functionally stronger than `main`, but visually it still reads like generic blue scheduling SaaS.

Observed from the exact QA screenshots and source:

- global brand primary is bright blue `#2563eb`;
- page background is blue-gray `#f6f8fc`;
- typography uses system Segoe-style fonts rather than the warmer SALON visual language;
- navigation icons are letter glyphs such as T / C / K / B / M;
- calendar cards use multiple pastel service colours plus blue status treatment;
- active navigation, buttons, selected calendar days and focus states all compete using blue;
- Today remains structurally sparse: summary strip + next time + appointment list;
- the mobile Calendar is a horizontally clipped/shrunk version of the desktop staff-column board rather than a purpose-built mobile vertical timeline;
- Calendar has strong operational mechanics already, but the visual meaning of service colour, staff identity and status can compete;
- Staff and Services are functionally editable but rely on dense inline `<details>` forms;
- Appointment detail is operationally useful but still form/table-like;
- Reports is intentionally basic and should remain secondary.

The visual problem is therefore **not lack of decoration**. It is insufficient semantic hierarchy and insufficient operational information density.

## 4. Market benchmark findings

Current public product research reinforces the brief:

- Fresha exposes calendar, blocked time, waitlist, schedule management, availability setup and automated reminders; its waitlist can notify clients when slots reopen.
- Salonized emphasises an at-a-glance daily calendar, reminders, online booking, resources, working hours, breaks and absences.
- Mangomint’s Express Booking explicitly targets phone/text back-and-forth: staff starts the booking, then sends a client link to finish it. Its Intelligent Waitlist matches openings to waitlisted clients.
- Booksy provides drag-and-drop appointment calendar, time off, smart schedule optimisation, automated waitlist, reminders and deposits/no-show protection.
- Treatwell Connect combines team scheduling and waitlist/rebooking with broader POS/inventory features.

Community feedback repeatedly highlights:
- booking/admin overload;
- calendars that are hard to trust or scan;
- too many add-ons/features;
- users who mainly need calendar + reminders rather than a whole POS;
- clients who still text instead of using booking links;
- cancellations creating hard-to-fill gaps;
- small businesses abandoning software when setup or daily actions become too complicated.

SALON should therefore compete on **speed and operational clarity**, not breadth.

## 5. Product hierarchy

### CORE NOW

1. richer visual/semantic system;
2. Today command centre;
3. Calendar operational UX;
4. functional appointment colour/status semantics;
5. full Staff editing UX;
6. full Services editing UX;
7. stronger Appointment detail;
8. stronger Customer detail;
9. operational search refinement;
10. reminders + confirmations foundation;
11. customer self-service;
12. Smart Booking Link.

### CORE / NEXT boundary

- deposits / no-show payment protection;
- waitlist / Fill the Gap.

### NEXT

- rebooking automation;
- recurring appointments;
- resource/room management.

### NOT PLANNED

- inventory suite;
- payroll;
- HR suite;
- large POS;
- marketplace;
- accounting;
- enterprise BI;
- franchise management;
- complex loyalty;
- broad marketing automation;
- social media planner.

## 6. Visual system

### Brand

SALON remains warm, European, quiet and premium.

Primary brand accent becomes the existing Experience direction:
- clay / terracotta: `#b15f2c`
- lighter accent: `#cf8047`
- dark accent: `#97501f`

Base:
- background: `#ffffff`
- foreground/ink: `#111111` / `#0a0a0a`
- surface: `#f1f0ee`
- surface 2: `#e3e2df`
- line: `#e6e5e2`
- muted: `#8d8d8d`

Semantic status family:
- pending / attention: warm amber/sand;
- confirmed: muted sage;
- checked-in / informational: muted blue;
- completed: graphite or restrained sage-dark;
- cancelled: soft red;
- no-show: stronger warning red.

### Colour rule

Use **one primary meaning per visual channel**.

For Calendar:
- appointment surface remains mostly neutral/soft;
- staff identity is carried by avatar/initial + a consistent thin rail/dot;
- appointment status is carried by a compact semantic chip/indicator;
- service is expressed with typography/content, not a second competing rainbow palette.

Avoid simultaneous service-colour + staff-colour + status-colour as full-card fills.

### Typography

Use Onest in the workspace where the existing Experience branch already established it, provided the implementation preserves performance and build reliability.

### Motion

Operational motion is subtle:
- drag feedback;
- save confirmation;
- dialog/drawer open/close;
- status transitions;
- hover/focus;
- calendar navigation.

Respect `prefers-reduced-motion`.

## 7. Workspace navigation

Desktop:
- quiet left navigation;
- real icons, not letter placeholders;
- clear active state using ink + accent, not bright blue everywhere;
- salon/team context;
- global search remains available.

Mobile:
- Today;
- Calendar;
- Customers;
- More.

Do not overload the bottom nav.

Blocks remains available but becomes less prominent because common blocking belongs in Calendar and Staff.

## 8. Today command centre

Today must answer in roughly three seconds:

1. what is happening now;
2. who is next;
3. where capacity is free;
4. what needs attention;
5. what action should happen next.

Required composition:
- next appointment;
- compact Today summary;
- meaningful gaps;
- attention block only when there is an actionable item;
- quick actions, with only the most important actions directly visible;
- chronological daily schedule.

Candidate quick actions:
- + Appointment;
- Block time;
- Share availability / Smart Booking Link;
- Add customer.

Do not turn Today into BI.

## 9. Calendar

### Desktop/tablet

Retain the proven staff-column implementation and existing drag/drop architecture.

Required:
- clear staff identity;
- current-time indicator;
- opening hours;
- breaks;
- blocks;
- free gaps;
- appointment status;
- quick creation;
- drag between times;
- drag between staff;
- optimistic move;
- server-authoritative validation;
- conflict rollback.

The current one-droppable-target-per-staff optimisation must be preserved unless measured evidence proves another approach is better.

### Mobile

Do **not** shrink the desktop columns.

At 375–430px, use a strong vertical day timeline:
- time;
- appointment;
- staff identity;
- status;
- gaps;
- blocks/breaks;
- tap to open;
- explicit Move action as the non-drag fallback.

Desktop drag remains a power feature. Mobile remains predictable.

## 10. Appointments

Appointment detail becomes an operational action centre.

Show clearly:
- customer;
- service;
- staff;
- start/end;
- duration;
- price;
- payment status;
- appointment status;
- note/contact information.

Primary actions are hierarchical:
- Complete / relevant next status;
- Move;
- Cancel.

Secondary menu:
- No-show;
- rebook;
- other less common actions.

Do not expose backend complexity as six equal CTAs.

## 11. Customers

Customer detail must show:
- contact;
- next appointment;
- last visit;
- history;
- cancellations;
- no-shows;
- internal notes;
- quick rebook;
- later: secure self-service link / alerts.

Do not build a medical record or heavyweight CRM.

## 12. Staff

Existing backend CRUD/schedule/break support is preserved.

Improve UX for:
- edit staff;
- role;
- services;
- weekly schedule;
- breaks;
- time off;
- active/inactive.

Staff identity gets:
- initials/avatar;
- consistent subtle colour.

Authentication/invite remains conceptually separate from the staff profile while no-login development continues.

## 13. Services

Existing full edit capabilities are preserved and presented more clearly:
- name;
- duration;
- buffer;
- price;
- description;
- online bookable;
- active/inactive;
- staff assignment.

Historical appointment snapshots must remain immutable when service data changes.

## 14. Reminders and confirmations

Commercial CORE.

Reuse the existing `notification_jobs` outbox.

Phase 1 channel:
- email.

Required events:
- confirmation immediately after booking;
- default reminder around 24 hours before appointment.

Do not mix delivery provider concerns into appointment persistence.

The browser is never notification truth.

## 15. Customer self-service

Add a secure no-account appointment link.

Customer may:
- view appointment;
- reschedule;
- cancel;

within salon rules.

Security:
- unguessable token or equivalent secure locator;
- server-side authorization;
- availability revalidated server-side;
- mutations audited;
- token leakage must not expose cross-tenant data.

## 16. Smart Booking Link

Owner starts from a phone/WhatsApp request and chooses:
- service;
- date or constrained date window;
- staff or no preference.

SALON generates a short-lived/context-aware link.

Customer sees only valid server-computed times and finishes contact/confirmation themselves.

This must reuse the existing availability engine and atomic booking path.

It is a workflow differentiator, not a claim that “booking links” themselves are unique.

## 17. Waitlist / Fill the Gap

Keep this simple when implemented:
- customer can join when no slot works;
- owner sees matches when a cancellation creates capacity;
- owner can send the free slot;
- automation may come later.

Do not turn this into a CRM subsystem.

## 18. Deposits / payments

Do not build a full POS.

When this slice is reached:
- none;
- fixed amount;
- percentage;
- full payment.

Provider must support an appropriate Netherlands/iDEAL strategy.

Payment status is server/webhook-owned, never browser-owned.

## 19. Security and correctness constraints

Non-negotiable:
- no client-side business truth;
- no weakening RLS;
- no tenant leakage;
- no bypass of atomic booking/reschedule;
- no loss of snapshot integrity;
- no drag/drop move that bypasses server validation;
- no production deployment without explicit Commander release decision.

Current no-login mode remains a development/preview concern. It must not become a reason to publish private customer data or weaken database policies.

## 20. Test and QA requirements

Every vertical slice follows:

design → failing test → minimal implementation → passing tests → browser QA → code review.

Required verification after relevant work:
- unit/domain tests;
- TypeScript;
- ESLint;
- production build;
- browser QA;
- responsive QA;
- accessibility checks;
- database/business-rule tests;
- concurrency tests where relevant.

Final responsive matrix:
- 320;
- 375;
- 390;
- 430;
- 768;
- 1024;
- 1440.

No “done” claim without current evidence.

## 21. Implementation strategy

Work in vertical slices, not twenty features at once:

1. visual system + Today + appointment semantics;
2. Calendar operational UX + mobile timeline;
3. Staff + Services + Customer/Appointment polish;
4. reminders/confirmations;
5. customer self-service;
6. Smart Booking Link;
7. deposit/no-show layer;
8. waitlist / Fill the Gap.

Each slice must remain deployable and testable on its own.

## 22. Definition of success

SALON is successful when the owner opens the app and immediately sees:
- what happens today;
- who comes next;
- which staff are working;
- where free space exists;
- what needs attention;
- what the next useful action is.

Frequent daily actions must complete in a few taps without sacrificing server-side correctness.
