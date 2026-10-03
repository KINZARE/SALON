# Proven components migration implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** Replace generic SALON infrastructure with maintained libraries while preserving ORSIRA UX and server-authoritative booking.
**Architecture:** Keep the existing domain and database transactions. Change boundary validation, form state, provider adapters, serialization, test runner, icons, and generic date helpers in separate verified commits.
**Tech Stack:** Next.js 16.3.8, React 19, TypeScript, Supabase, Node 22/24.
**Spec:** docs/migrations/proven-components-spec.txt

## Global constraints
- Start from actual main fd56cf66bc7ec1df84ad15f1fb1cdf6b92a94d6f in a fresh isolated checkout.
- Preserve booking engine, availability, database truth, tenant scope, calendar UX, dnd-kit, authentication policy and current ORSIRA UI.
- No marketing, redesign, or new product features.
- Use pinned package versions and commit the lockfile.
- Every phase runs tests, typecheck, lint and build; browser and database evidence gates release.
- Queue, search and Temporal changes require evidence; retaining working implementations is valid.

## Review focus
- Malformed/null/array API payloads return 400 before data mutations.
- Truncation, contact rules, permission checks, field order and intake version semantics remain consistent.
- Email retries preserve idempotency; CSV formulas never execute.
- Calendar dates remain date-only across host timezones and DST boundaries.
- Client bundles exclude provider/CSV packages and do not significantly regress outside the intake route.

## Tasks
- [ ] 0. Repair pre-existing incomplete npm lock; clean install, 80-test baseline, typecheck/lint/build, baseline bundles/live measurements.
- [ ] 1. Add Zod; replace UUID/date and main action/API/intake input validators; regression malformed inputs, calendar dates, service numbers, deposit, contacts, report ranges.
- [ ] 2. Migrate intake editor to useForm/useFieldArray/zodResolver; keep action payload, linking, consent and ordering; browser add/move/remove/save/error tests.
- [ ] 3. Use official Resend SDK in one existing server adapter; mock configuration, success/failure, missing ID and idempotency; preserve notification state tests.
- [ ] 4. Use csv-stringify server export with BOM, CRLF and formula escaping; test special characters, Unicode, empty cells and malicious formulas.
- [ ] 5. Move existing workspace and responsive QA scenarios into Playwright Test fixtures/config, failure traces/screenshots/console/URL and CI reporters. Preserve existing scenario assertions and performance scripts.
- [ ] 6. Map existing semantic workspace icons to tree-shakable Lucide; accessible SVG behavior, browser navigation and bundle check.
- [ ] 7. Use date-fns with explicit UTC context for calendar/report date-only helpers; week/month/leap/year/DST and multiple host timezone regression.
- [ ] 8. Inspect live tenant search datasets and query plans; additive pg_trgm only if evidence supports improvement; preserve bounded two-character UX.
- [ ] 9. Evaluate live pgmq compatibility versus existing SKIP LOCKED job lifecycle; migrate only with reliable transition and measurable benefit.
- [ ] 10. Evaluate native Temporal/runtime and server-only polyfill; DST tests and bundle impact determine GO/NO-GO.
- [ ] 11. Full fresh install/unit/type/lint/build, Playwright/mobile/live preview, DB concurrency/integration/security and before/after performance; branch review, exact SHA PR merge and production smoke.

## Baseline findings
- main fd56cf6 already contains ORSIRA rebrand; old production deployment metadata still points to ae0b530, so actual alias and current release activity must be rechecked before release.
- npm ci failed because optional platform dependencies are absent from package-lock; npm install --package-lock-only repaired resolution, then npm ci passed.
- Initial unit suite 80/80, typecheck/lint/build passed after lock repair.
- New regression demonstrates existing isIsoDate incorrectly accepts 2026-02-30.
- Git HTTPS push has no credentials; use the connected GitHub write tools to publish verified commits.
