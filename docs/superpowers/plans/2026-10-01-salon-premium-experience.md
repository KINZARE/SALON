# SALON Premium Experience Redesign — Implementation Plan

Date: 2026-10-01
Spec: `docs/superpowers/specs/2026-10-01-salon-premium-experience-design.md`

## File map

Primary modifications:
- `src/app/globals.css` — tokens, typography, focus, motion and shared visual utilities.
- `src/app/layout.tsx` — Onest font.
- `src/components/ui/button.tsx` — tactile SALON button system.
- `src/components/ui/field.tsx` — input/textarea styling.
- `src/components/ui/empty-state.tsx` — premium empty states.
- `src/components/app-shell/nav.tsx` — desktop/mobile navigation.
- `src/app/app/layout.tsx` — application shell and top context.
- `src/app/app/today/page.tsx` — product-heart redesign.
- `src/app/app/calendar/page.tsx` — mobile-first day view.
- `src/app/app/customers/page.tsx` — search/list-ready customer surface.
- `src/app/app/services/page.tsx` — premium service menu/editor layout.
- `src/app/app/staff/page.tsx` — people-focused staff presentation.
- `src/app/app/settings/page.tsx` — sectioned settings hierarchy.
- `src/components/booking/booking-flow.tsx` — public booking visual/interaction redesign.
- `src/app/book/[salonSlug]/page.tsx` — booking shell.
- `src/app/page.tsx` — premium marketing website.

Secondary review:
- auth routes;
- appointment detail/create/reschedule;
- More/Reports/Blocks;
- loading/error/not-found states.

## Task 1 — Establish visual foundation

1. Replace current green-led tokens with SALON warm neutral + burnt-orange tokens.
2. Add Onest through Next font handling.
3. Add radius, surface, focus and motion tokens.
4. Respect `prefers-reduced-motion`.
5. Restyle Button, Field and EmptyState without changing public APIs.
6. Commit as one design-foundation change.

Verification:
- no changed server/data imports;
- compile-safe class strings;
- accessibility labels unchanged.

## Task 2 — Redesign app shell

1. Restyle desktop left nav.
2. Make active states quiet and clear.
3. Improve mobile bottom-nav touch targets/safe area.
4. Redesign app top context and public-booking link.
5. Preserve role-based nav decisions.
6. Commit separately.

Verification:
- routes unchanged;
- staff remains restricted from Customers and admin routes;
- mobile nav stays four items or fewer.

## Task 3 — Redesign Today and Calendar

Today:
- clearer operational header;
- next appointment emphasis;
- compact metrics;
- continuous schedule;
- stronger tap targets and state labels.

Calendar:
- refined date strip;
- better timeline rhythm;
- stronger appointment blocks;
- preserve URL date state and server data source.

Verification:
- no client-side availability calculation added;
- appointment links/statuses intact;
- empty state works;
- 320px layout remains non-overflowing.

## Task 4 — Redesign management surfaces

Customers:
- quiet searchable/list-ready visual hierarchy without adding a new backend search contract.

Services:
- price/menu-like list and focused create form.

Staff:
- people-first list, schedule context preserved.

Settings:
- clearly separated Salon / Opening hours / Booking / Account sections using separators more than cards.

Verification:
- all forms keep existing server actions and field names;
- role restrictions unchanged.

## Task 5 — Redesign public booking

1. Keep current step model/API calls.
2. Refine progress.
3. Redesign service/staff rows.
4. Improve date and time selection.
5. Preserve loading/error behavior.
6. Improve details summary and success state.
7. Keep form data through recoverable booking errors.

Verification:
- request payload unchanged;
- `staffId=null` still represents no preference;
- no account requirement;
- slot selection remains server-sourced.

## Task 6 — Rebuild marketing homepage

1. Floating SALON header.
2. Editorial hero with real product positioning.
3. Product-composition hero using static UI markup inspired by real app surfaces.
4. Booking story section.
5. Today/Calendar/Booking/Customers showcase.
6. Dark availability section using verified architecture facts only.
7. Product-principles trust section instead of fake testimonials.
8. Dark rounded footer with CTA.
9. Keep CTA destinations tied to routes that actually exist.

Verification:
- no fake metrics/testimonials;
- no stock imagery requirement;
- links resolve to real routes;
- mobile hero remains understandable.

## Task 7 — Secondary consistency pass

Review:
- login/signup/onboarding;
- appointment detail/create/reschedule;
- More/Reports/Blocks;
- loading/error/not-found.

Apply only small presentation changes needed for consistency. Do not expand scope.

## Task 8 — Quality and browser QA

1. Push complete feature branch.
2. Wait for GitHub quality checks.
3. Fix any test/type/lint/build failures.
4. Run React/Next best-practice review.
5. Create preview route for browser QA without merging preview-only login bypass into main.
6. Browser-test core flows and responsive viewports.
7. Check console/runtime errors.
8. Record tested SHA.
9. Open PR to main with QA evidence.

## Stop conditions

Do not claim complete if:
- CI is red;
- booking flow regresses;
- mobile overflow exists in a core flow;
- preview cannot be browser-tested;
- tested SHA differs from current branch HEAD.
