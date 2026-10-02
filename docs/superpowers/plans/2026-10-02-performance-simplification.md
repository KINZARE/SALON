# SALON Performance and Simplification Implementation Plan

> Execute inline with superpowers:executing-plans. The user has authorized implementation, PR, verified preview and safe production release end-to-end.

**Goal:** Reduce measured load/navigation latency and unused code while preserving the supplied product allowlist.

**Architecture:** Keep authoritative Supabase transactions and tenant-scoped server queries. Measure the immutable production baseline before runtime edits. Keep all data needed for scheduling fresh, scope reads to displayed dates, isolate auth session refresh, and colocate compute with Frankfurt.

**Tech Stack:** Existing Next.js 16.3, React, TypeScript, Supabase and Vercel.

**Spec:** User attachment SALON PERFORMANCE & SIMPLIFICATION EXECUTOR, 2026-10-02.

## Constraints and review focus
- No rewrite, new product features, schema destruction or deletion of historical migrations.
- Never cache definitive availability, booking, payments, mutations or sensitive tenant data across requests.
- Preserve exact-head tests, browser QA and preview gates before release; compare main before merging.
- Test timezone/DST bounds, bookings overlapping the beginning of a day, future blocks and date exceptions.
- Auth restoration must preserve session refresh; runtime secrets remain server-only.

## Tasks
- [ ] Record live production SHA, compute/database regions, three-sample route baselines and source query map before edits.
- [ ] Add regression coverage for no-login session roundtrips and bounded calendar reads; implement measured network/data improvements.
- [ ] Audit rendering and cache boundaries; retain freshness with explicit dynamic request boundaries and immediate navigation feedback.
- [ ] Audit marketing, orphan components, dependencies, assets and workflows with references and route inventory; remove only proven dead code.
- [ ] Run unit/type/lint/build, database rollback/security/concurrency, all existing flows and requested responsive widths.
- [ ] Review exact diff, compare before/after live Preview, update production gate to candidate SHA, merge only green candidate, verify production.

## Execution ledger
- Setup: isolated current-source snapshot matches every GitHub blob at ef4c5369117de1742845e219e16626ff9f278ce6. Existing unrelated staged workspace is untouched.
- Production baseline is collected in GitHub Actions because the execution environment cannot reach GitHub/Vercel directly and the Vercel connector lacks project permission.
- Marketing root already redirects to Today in main; removal still requires orphan/style/dependency audit.
