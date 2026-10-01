# SALON Premium Experience Redesign — Design Spec

Date: 2026-10-01
Branch: `experience/premium-redesign`
Base: `main@8e723845`

## Objective

Transform the existing SALON marketing site and operational app into one cohesive premium product experience without changing the authoritative booking, availability, Supabase, RLS, appointment, customer, staff, payment or notification architecture.

The supplied SALON Premium Website + App Experience master prompt is the visual/product brief. This document maps that brief onto the current repository.

## Current-state audit

### Keep
- Existing Next.js 16 App Router structure.
- Existing Supabase SSR/auth wiring and role-aware app context.
- Existing centralized server/domain availability and booking behavior.
- Existing Today, Calendar, Customers, Services, Staff, Settings, appointment and public booking routes.
- Existing mobile-first route structure and server-component bias.
- Existing preview/demo-mode separation.

### Redesign
- Global visual tokens and typography.
- Marketing homepage.
- App shell and navigation.
- Today visual hierarchy and schedule presentation.
- Calendar day view.
- Public booking presentation.
- Customer, Services, Staff and Settings surfaces.
- Shared buttons, fields, empty states and notices.

### Simplify
- Repeated page-local styling.
- Generic green SaaS accent.
- Small fragmented utility UI.
- Excess explanatory text where hierarchy can carry meaning.
- Repetitive border/card treatment.

### Do not change
- Database schema/migrations.
- RLS/security model.
- Booking RPC or availability calculation.
- Appointment state transitions.
- Payment truth boundaries.
- Notification persistence model.
- Preview-only login bypass behavior.

## Product direction

SALON should feel calm, tactile, editorial, warm and highly operational. Marketing may use larger typography and cinematic composition; the app stays compact and task-first.

Design foundations:
- near-white backgrounds;
- warm-gray surfaces;
- deep near-black feature areas;
- burnt-orange accent;
- Onest typography;
- strong negative space;
- large radii only for major groups;
- pill controls for selected/primary actions;
- thin warm separators;
- restrained motion;
- no gradients, glassmorphism, dashboard card soup or invented social proof.

## Architecture

### Global design layer
`src/app/globals.css` becomes the design-token source for color, radius, shadows, focus, motion, surface primitives and typography helpers.

`src/app/layout.tsx` loads Onest via `next/font/google` and exposes the font variable globally.

### Shared UI
Existing `Button`, `Field`, `TextAreaField` and `EmptyState` remain the base primitives and are restyled rather than replaced with a new component library.

Add only small reusable primitives where repetition is already present, such as page eyebrow/header helpers or lightweight appointment presentation pieces. Do not introduce a generalized design-system framework.

### App shell
Desktop keeps left navigation. Mobile keeps bottom navigation. Primary information architecture remains Today / Calendar / Customers / More. Owner/manager secondary routes remain available. Role restrictions stay server-authoritative.

### Today
Today becomes the operational heart:
- strong date/salon context;
- next appointment emphasis when present;
- compact daily metrics;
- continuous schedule;
- clear available gaps when data permits without reimplementing availability client-side;
- direct New appointment action for authorized roles.

Do not invent gap availability from appointment timestamps alone. Only show explicit availability information if supported by existing data.

### Calendar
Keep the existing day-focused route and URL date state. Improve date navigation, appointment blocks, scanning hierarchy and responsive behavior. Do not build a resource scheduler that requires new domain queries in this redesign.

### Public booking
Preserve the existing step/state machine and API calls. Redesign visual hierarchy, service rows, staff selection, date strip, time pills, form, loading/error/conflict/success presentation. No account requirement.

### Marketing website
Rebuild `src/app/page.tsx` using actual product concepts and existing route links:
- floating header;
- editorial hero;
- composed Today/Calendar/booking product visual built from static presentational markup;
- booking-story section;
- product showcase;
- one dark availability section using verified product facts only;
- trust/product-principles section;
- premium dark footer.

No fake testimonials, logos, metrics or customer counts.

## Motion

Use CSS-first motion only:
- restrained entrance/reveal;
- fast tactile hover/press feedback;
- reduced-motion override;
- no animation dependency.

A one-time marketing intro loader is allowed only if it does not delay interaction materially and can be implemented accessibly. It will be deferred if it requires unnecessary client JS.

## Accessibility

- semantic headings and landmarks;
- 44px+ touch targets for important controls;
- visible focus;
- keyboard-safe nav/forms;
- no hover-only information;
- reduced motion;
- form labels preserved;
- contrast kept above decorative subtlety.

## Performance

- keep Server Components where they already work;
- add client components only for real interaction;
- no heavy animation or icon package;
- no client-side duplication of server data;
- no new data waterfalls.

## Verification

Required before completion:
- GitHub quality workflow: tests, typecheck, lint, build;
- browser verification on preview for homepage, Today, Calendar, Customers, Services, Staff, Settings and public booking;
- responsive checks at 320, 375/390, 430, 768, 1024 and 1440 where tooling permits;
- console/runtime error scan;
- booking interaction smoke test without altering production data;
- confirm final QA SHA matches branch HEAD.

## Release strategy

1. Implement on `experience/premium-redesign`.
2. Keep changes presentation-focused.
3. Open PR to `main`.
4. Use a preview deployment or temporary preview-branch integration for browser QA.
5. Do not merge/release until verified.
