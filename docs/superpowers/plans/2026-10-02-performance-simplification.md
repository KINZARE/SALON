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

- Baseline completed before runtime changes; current-source query comparison validates Today 9→6 requests and month payload 12,328→2,052 bytes.
- Network, data, rendering, cleanup implemented; preview functions independently inspected in fra1.
- Independent review fixes: historical appointment bounds and malformed staff UUID; RED→GREEN.
- Local 66 tests, typecheck, build pass; lint has zero errors and one unchanged PostCSS warning.
- Initial fresh CI install issue repaired and validated with npm ci; temporary lock recovery artifact step removed.
- Browser QA: 14 workspace paths across 320/360/375/390/430/768/1024/1280/1440, no runtime errors.
- Database rollback integration and product regression pass; 15 concurrency races pass with fixture removed.
- Remaining: final exact-head preview/measurement, report and release gate, safe merge, production verification and superseded PR cleanup.

- Public booking/embed N+1 staff-per-service reads replaced by one batch query. Booking effect regression discovered by real form-flow test and corrected with step===3 availability guard.
- First measured live preview: mobile Today LCP 1596→732ms, Day 2768→700ms, calendar JS 167407→148518 bytes. Mobile link navigation was nearly unchanged; targeted full Calendar prefetch added with data-saving/slow-network opt-out and existing invalidation retained.

Review correction: removed full Calendar prefetch to preserve fresh cross-session appointment reads. Production alias verification now checks current alias deploymentId, followed by public-alias QA.
