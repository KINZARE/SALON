# ORSIRA Bukuna-inspired Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the existing ORSIRA product and add its marketing surface in the supplied Bukuna-inspired direction without changing business logic.

**Architecture:** Update the central design tokens and fonts first so existing operational screens inherit the new system. Then add the marketing homepage/pricing surface and refine the existing app shell/shared primitives. Preserve all domain contracts; verify with existing source-contract tests plus CI, build and preview smoke tests.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Supabase, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/2026-10-05-orsira-bukuna-rebrand-design.md`

## Global Constraints

- Keep brand name ORSIRA.
- No Supabase schema, migration or RLS changes.
- No booking/availability/calendar/KPI/business-rule rewrite.
- No Bukuna logo, copy, exact interface or product duplication.
- No fabricated testimonials or numeric pricing.
- Mobile-first; preserve current routes and component APIs.

## Review Focus

1. Existing app routes must still compile and retain their role-aware navigation.
2. Marketing root must not accidentally require authenticated app context.
3. New green accents must keep readable contrast and visible focus states.
4. Mobile navigation and homepage must not introduce horizontal overflow at 320px.
5. Existing booking/customer-facing flows must keep their components and server truth.

---

### Task 1: Brand contract tests

**Files:**
- Modify: `tests/orsira-branding.test.ts`

- [ ] Write source-contract assertions for the new tokens, Manrope display typography, marketing homepage and pricing route.
- [ ] Run CI on the test-only commit and confirm the new assertions fail for the expected missing brand implementation.

### Task 2: Brand foundation

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/field.tsx`

- [ ] Implement the approved token set and Inter + Manrope font variables.
- [ ] Keep Button/Field public APIs stable while translating visual states.
- [ ] Verify the brand contract turns green without breaking the rest of the suite.

### Task 3: Marketing surfaces

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/pricing/page.tsx`

- [ ] Build a responsive ORSIRA homepage with navigation, hero, product mockup, benefits, capabilities, workflow/trust, CTA and footer.
- [ ] Add a pricing-information page without inventing numeric pricing.
- [ ] Keep the homepage independent from authenticated app context.

### Task 4: Product shell translation

**Files:**
- Modify: `src/components/app-shell/nav.tsx`
- Modify: `src/app/app/layout.tsx`

- [ ] Translate wordmark/navigation/header into the new system.
- [ ] Preserve all role-aware routes and mobile navigation behavior.
- [ ] Use accent green deliberately rather than turning the entire app green.

### Task 5: Whole-product verification

**Files:** existing test/build/preview surfaces only unless a regression fix is required.

- [ ] Run full tests, typecheck, lint and production build through GitHub Actions.
- [ ] Inspect the branch diff for accidental domain/data/security changes.
- [ ] Verify the exact tested SHA has a Vercel preview.
- [ ] Smoke-check homepage, Today, Calendar and one customer-facing booking route from the preview.
- [ ] Record known issue: public numeric pricing still requires a product-owner decision.
