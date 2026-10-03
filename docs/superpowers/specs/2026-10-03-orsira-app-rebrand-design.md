# ORSIRA App Rebrand — Design Spec

Date: 2026-10-03
Repository: `KINZARE/SALON`
Branch: `brand/orsira-app-rebrand-20261003`
Base: `main@ae0b530a7e142f546609e20a06c81a5cb2b22b34`

## Objective

Rebrand the existing SALON operational application to ORSIRA while preserving all working product behavior.

This is a presentation-layer rebrand of the app, not a product rebuild. Existing routes, booking/availability logic, appointment behavior, Supabase schema/RLS, role restrictions, reports, intake, self-service, waitlist and public booking behavior remain authoritative and unchanged unless a narrowly scoped presentation fix is technically required.

The marketing website is explicitly out of scope and must not be modified.

## Product intent

ORSIRA is salon software for modern beauty businesses, initially focused on salons with roughly 2–10 team members across hair, nails, brows, lashes and skin, with enough visual flexibility to extend later into wellness and aesthetics.

The product should feel like a calm operational control centre for a busy salon: premium, editorial, warm, human, precise, refined and modern.

Brand essence:
- calm;
- personal;
- refined.

Creative direction:
- soft precision with human warmth;
- premium hospitality × editorial restraint × excellent business software.

The primary product feeling is: **everything is under control**.

## Current-state audit

The current `main` already has a strong application structure that should be preserved:
- Next.js App Router;
- centralized global styles in `src/app/globals.css`;
- shared UI primitives under `src/components/ui`;
- a dedicated app shell under `src/components/app-shell`;
- operational workspace components under `src/components/workspace`;
- booking components under `src/components/booking`;
- role-aware app navigation and server-side app context;
- established Today, Calendar, Customers, Services, Staff, Reports, Settings, appointment, booking-link, waitlist, intake and self-service routes.

Current visual implementation still reflects the previous SALON identity:
- Urbanist is the global font;
- lime/cyan brand tokens are defined centrally;
- the body uses decorative radial gradients;
- the sidebar contains a circular SALON initial mark and literal SALON wordmark;
- active navigation uses a dark pill-like treatment with bright accents;
- several screens use large rounded panels and visual emphasis that does not match the ORSIRA reference.

These are presentation concerns only. They do not justify rewriting working domain or data architecture.

## Scope

### In scope

- visible app branding from SALON to ORSIRA;
- global design tokens;
- global typography;
- app metadata where app-specific;
- ORSIRA wordmark treatment in the application shell;
- compact ORSIRA mark for app-specific icon/favicons where practical and safe;
- desktop sidebar and mobile bottom navigation;
- app header/top context;
- shared buttons, fields, status treatments, empty/loading/error states;
- Today;
- Calendar day/week/month surfaces already present in the product;
- appointment create/detail/reschedule/cancel presentation;
- Customers and customer detail;
- Services and service categories;
- Staff;
- opening-hours/exceptions surfaces;
- intake and consent surfaces;
- Reports and CSV export presentation;
- booking widget/public booking;
- Smart Booking Links;
- waitlist;
- customer self-service;
- responsive/mobile polish;
- accessibility and interaction-state polish.

### Out of scope

- marketing homepage or other marketing pages;
- pricing;
- new product features;
- backend rewrite;
- database redesign;
- new Supabase migrations unless an unforeseen app-branding blocker makes one unavoidable;
- RLS changes;
- auth architecture changes;
- booking engine rewrite;
- calendar engine replacement;
- payment architecture changes;
- renaming internal technical identifiers merely for branding consistency.

## Visual system

### Color

The app is predominantly white/light.

Core tokens:
- `background`: `#FFFFFF` Pure White;
- `surface`: `#FFFFFF`;
- `surface-muted`: `#FAF7F2` Warm White;
- `neutral`: `#D9D4CC` Soft Stone;
- `foreground`: `#2B2B2B` Charcoal;
- `primary`: `#7B3F46` Muted Burgundy;
- `support-success`: `#A7B89F` Soft Sage.

Additional semantic colors for warning, danger, muted copy, focus and appointment states may be retained or adjusted, but they must be derived for readability and not turn the product into a rainbow palette.

Rules:
- white is dominant;
- charcoal carries primary text;
- muted burgundy is the controlled ORSIRA accent;
- soft sage is supportive, not decorative;
- avoid gradients, glow and glassmorphism;
- use borders and spacing before shadows;
- keep shadows subtle and rare;
- use appointment colors at low saturation with sufficient text contrast.

### Typography

Use Next.js font handling so fonts are self-hosted by the framework at build time.

- Inter is the default UI font for navigation, forms, tables, calendar, reports, customer data, settings and mobile.
- Playfair Display is a display/editorial font used sparingly for brand moments, selected large headings and a limited set of empty/onboarding states.
- Playfair must not be used for dense operational data.

Readability and scan speed take priority over branding.

### Shape and surfaces

- reduce the current tendency toward large radii;
- use smaller, consistent rounding for controls and minor surfaces;
- reserve larger rounding only for genuinely major grouped surfaces;
- remove pill treatment where a normal button, tab or row state communicates better;
- avoid card grids when tables, rows or grouped sections are clearer.

### Brand mark

Primary wordmark: **ORSIRA**.

The application shell should use a refined typographic wordmark rather than an illustrative salon symbol.

A compact O/S-derived mark may be used for app icon, favicon or very constrained mobile states, but it must remain simple and secondary to the wordmark. No scissors, combs, faces, flowers, crowns or generic beauty icons.

## Architecture

### Global design layer

`src/app/globals.css` remains the single source for ORSIRA color, surface, border, radius, shadow, focus, selection and reduced-motion tokens.

Hardcoded legacy SALON colors should be replaced with semantic CSS variables wherever practical. Existing component APIs should remain intact.

### Typography layer

`src/app/layout.tsx` will replace Urbanist with Inter and Playfair Display via `next/font/google` and expose variables for both fonts.

Global UI defaults to Inter. Playfair is opt-in through a dedicated class/token rather than applied globally.

Root metadata visible in the product should use ORSIRA. Internal application/package identifiers may stay unchanged.

### Shared UI primitives

Existing `Button`, `Field`, `TextAreaField`, `EmptyState`, `StatusChip` and workspace icon patterns are restyled rather than replaced with a new component framework.

Principles:
- preserve props and public APIs;
- retain semantic HTML;
- retain disabled/loading behavior;
- use visible keyboard focus;
- keep important controls at least 44px in touch-friendly contexts;
- do not introduce a heavy design-system dependency.

### App shell

Desktop keeps the existing left sidebar and role-based route logic.

Mobile keeps the existing bottom navigation model.

Changes are visual and presentational:
- ORSIRA wordmark at the top;
- remove bright circular SALON badge styling;
- quiet active state using surface/border/type emphasis with controlled burgundy accent;
- consistent icon weight;
- cleaner group labels and separators;
- reduced radius and shadow treatment;
- ORSIRA branding in mobile header;
- maintain all role restrictions and route-active behavior.

### Today

Today stays operational rather than turning into a KPI dashboard.

Priority order:
1. what is happening today;
2. what needs attention;
3. what the next action is;
4. relevant core metrics.

Implementation direction:
- preserve existing server data and `getTodayWorkspace` flow;
- keep next-appointment prominence but move away from a visually heavy dark hero if it conflicts with the white ORSIRA base;
- keep metrics compact and limited;
- keep schedule/timeline primary;
- keep gaps/attention secondary;
- preserve links and permissions.

### Calendar

Calendar is treated as a high-density operational surface.

Requirements:
- keep current data sources and drag/reschedule behavior;
- preserve day/week/month routes or states already supported;
- maintain clear staff columns;
- distinguish appointment types with muted colors;
- selected, hover, focus and conflict states remain obvious;
- long names truncate or wrap intentionally without overflow;
- mobile receives a purpose-built layout, not merely a scaled desktop grid;
- no new scheduling engine is introduced.

### Customers, Services, Staff, Reports and Settings

Prefer rows, sections and tables over oversized card grids.

Use whitespace, typography and thin dividers as the main hierarchy tools.

Dense operational data may remain dense where that improves speed and clarity.

### Booking and customer-facing app flows

Public booking, booking links, waitlist, intake and self-service keep their existing state machines, API calls and server truth.

Only presentation, ORSIRA branding, microcopy consistency and responsive behavior change.

No new account requirement and no client-side recreation of authoritative booking rules.

## Interaction and motion

Motion should be subtle, fast and functional.

Use existing CSS transitions where possible for:
- navigation feedback;
- hover/focus/press states;
- modal/drawer transitions;
- save/processing/success/error transitions;
- drag/drop feedback.

Do not introduce theatrical marketing animations into the work app.

Respect `prefers-reduced-motion`.

Avoid indefinite spinners where a more explicit processing state is available.

## Copy and microcopy

Visible product copy should be short, human and calm.

Examples of the desired tone:
- “Afspraak staat gepland.”
- “Dat lukte niet. Probeer het opnieuw.”
- “Je afspraak staat.”

Avoid celebratory marketing language or verbose system wording in the operational UI.

Do not rewrite domain terminology arbitrarily if current labels are already understandable and operationally established.

## Accessibility

The rebrand must not reduce usability.

Verify:
- WCAG-compatible contrast for text and controls;
- visible `:focus-visible` states;
- keyboard navigation;
- semantic headings/landmarks;
- labels and form errors;
- screen-reader basics;
- disabled states;
- touch target sizing;
- no hover-only meaning;
- reduced-motion support.

Muted colors must not be used where they make critical content illegible.

## Responsive behavior

Minimum responsive QA widths:
- 320px;
- 375px;
- 390px;
- 430px;
- 768px;
- desktop widths used by the existing QA suite.

Check especially:
- bottom navigation;
- sidebar/header transition;
- calendar;
- appointment detail/create/reschedule;
- customer profile;
- forms;
- drawers/modals;
- long salon/customer/service names;
- error messages;
- loading and empty states;
- keyboard/input behavior;
- scrolling and horizontal overflow.

## Data flow and security

No intentional data-flow changes are part of this rebrand.

Server components, server actions, API routes, Supabase queries, RLS boundaries and domain logic remain authoritative.

The implementation must not:
- expose secrets client-side;
- bypass authorization;
- loosen RLS;
- duplicate booking or availability logic in the browser;
- mutate database schemas simply for visual consistency.

If a presentation component currently depends on a stable data contract, preserve that contract.

## Error handling

Existing functional errors and retry paths stay intact.

The rebrand may improve presentation and microcopy, but must preserve:
- recoverable booking conflicts;
- form validation;
- server-action error propagation;
- loading states;
- empty states;
- error boundaries;
- retry actions.

## Expected file areas

Primary changes are expected in:
- `src/app/globals.css`;
- `src/app/layout.tsx`;
- `src/components/ui/*` presentation primitives;
- `src/components/app-shell/*`;
- `src/app/app/layout.tsx`;
- Today and Calendar pages/components;
- management pages under `src/app/app/*`;
- appointment presentation components;
- booking/intake/waitlist/self-service presentation components;
- app-specific icon/metadata files where present.

`src/app/page.tsx` and other marketing surfaces must not be modified.

## Delivery strategy

1. Work from current verified `main` on `brand/orsira-app-rebrand-20261003`.
2. Establish ORSIRA tokens and typography first.
3. Restyle shared primitives.
4. Rebrand app shell/navigation.
5. Restyle Today and Calendar.
6. Restyle remaining operational screens and app states.
7. Audit customer-facing application flows.
8. Run responsive/accessibility/regression review.
9. Run tests, typecheck, lint and production build.
10. Run browser QA for critical flows and target widths.
11. Create a Vercel Preview from the exact tested SHA.
12. Smoke-test the preview and fix regressions before declaring the work ready.
13. Open a PR to `main` with the tested SHA and QA evidence.
14. Do not merge unless the verified branch HEAD is still the exact tested SHA.

## Critical regression flows

At minimum verify:
- Today;
- Calendar Day;
- Calendar Week;
- Calendar Month;
- appointment create/edit;
- drag/reschedule;
- Customers;
- customer detail;
- Services;
- service categories;
- Staff;
- opening hours/exceptions;
- intake forms;
- consent;
- Reports;
- CSV export;
- booking widget;
- public booking;
- Smart Booking Links;
- waitlist;
- customer self-service.

## Acceptance criteria

The rebrand is complete only when:
- visible app branding uses ORSIRA;
- the app reads as one coherent ORSIRA product system;
- white/light surfaces are dominant;
- muted burgundy is used as the primary controlled brand accent;
- soft sage is reserved for supportive semantic use;
- Inter is the operational UI font;
- Playfair is restrained to editorial/brand moments;
- existing business functionality remains intact;
- no marketing page has been changed;
- mobile UX is first-class and free of core-flow horizontal overflow;
- accessibility regressions are not introduced;
- tests pass;
- typecheck passes;
- lint passes;
- production build passes;
- critical browser flows pass;
- a working Vercel Preview exists for the exact tested SHA;
- the preview is visually and functionally smoke-tested.

## Non-goals

This work does not attempt to make the brandboard a pixel-perfect dashboard specification. The board provides identity, atmosphere, typography and palette direction. Actual application UX remains optimized around real operational tasks, density, accessibility and existing product behavior.
