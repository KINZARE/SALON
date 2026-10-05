# ORSIRA Bukuna-inspired Rebrand — Design Spec

Date: 2026-10-05
Base: `main@bd1dbf8d3350a5cbba70dcf1d573e67ddcc40256`
Branch: `brand/orsira-bukuna-rebrand-20261005`

## Objective

Translate ORSIRA into the supplied Bukuna-inspired visual direction without copying Bukuna branding, copy, logo, product or exact interface. Keep ORSIRA as the brand and preserve all working domain logic, Supabase architecture, RLS, booking/availability, calendar, KPI and business rules.

## Brand direction

ORSIRA should feel clear, modern, light, practical, friendly and quietly premium. It should read as Dutch/European business software for salons rather than luxury beauty branding or generic blue SaaS.

### Tokens

- Background: `#FBFCF8`
- Surface: `#FFFFFF`
- Surface soft: `#F2F5EF`
- Ink: `#171A17`
- Muted: `#626A63`
- Subtle: `#8A938B`
- Border: `#E1E7DE`
- Border strong: `#D1D9CE`
- Primary dark: `#1B241D`
- Primary hover: `#101611`
- Primary soft: `#EDF2ED`
- Accent green: `#58C96D`
- Accent hover: `#48B95D`
- Accent soft: `#EAF8ED`
- Success: `#2F7D46`
- Warning: `#9B671F`
- Danger: `#B54842`

Primary operational actions remain dark for contrast and stability. Green is an intentional accent for marketing CTAs, selection/progress/supporting states and the explicit accent button variant.

### Typography

- Body/interface: Inter.
- Display/headlines/wordmark: Manrope.
- Remove Playfair from the product brand layer.
- Dense operational data stays in Inter.

### Components

- 10–12px control radius; 16px major surface radius.
- Borders and whitespace before shadows.
- No gradients, glow or glassmorphism.
- Strong focus states and at least 44px touch targets for primary interactive controls.
- Icons stay simple and functional.

## Marketing website

Replace the root redirect with an actual ORSIRA homepage. Required flow: compact navigation, direct hero, real product UI mockup built from ORSIRA concepts, benefit rail, core capabilities, workflow/proof section without fabricated customer claims, closing CTA and footer. Add `/pricing` as a release-safe pricing-information page without inventing a monetary price; public numeric pricing remains a product-owner decision.

## App

Preserve routes and behavior. Rebrand centrally through tokens, typography, shared primitives and shell. Update active navigation to use dark type plus a green indicator, keep white/light surfaces dominant, and preserve mobile bottom navigation. Existing Today, Calendar, Customers, Services, Staff, Reports, Settings and customer-facing booking flows inherit the brand system without data-flow changes.

## Accessibility and responsive

Verify 320, 360, 375, 390, 430, 768, 1024, 1280 and 1440 widths. Check focus visibility, contrast, semantic headings/landmarks, touch targets, long labels and horizontal overflow. Respect `prefers-reduced-motion`.

## Security and regression constraints

No database migrations, RLS changes, auth bypasses, booking-engine rewrites, calendar-engine replacement or client-side duplication of server truth. No secrets in frontend code.

## Acceptance

- ORSIRA remains the visible brand.
- Brand is light, modern, green-accented and sans-serif.
- Root is a real marketing homepage rather than an app redirect.
- App shell and shared controls use the same system.
- Existing domain behavior remains intact.
- Tests, typecheck, lint and production build pass.
- Preview deploy exists for the exact tested SHA and receives a smoke check.
