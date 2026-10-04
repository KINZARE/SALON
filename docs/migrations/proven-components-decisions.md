# Proven component migration decisions

Baseline: main `fd56cf66bc7ec1df84ad15f1fb1cdf6b92a94d6f`, ORSIRA runtime; isolated checkout and migration branch. Preview reference: `https://salon-7qp9srmha-kwinphetmanee-2069.vercel.app` (`e084d5a`, identical application runtime before migration). Old listed production deployment metadata was `ae0b530`; aliases will be reverified before release.

| Phase | Decision | Evidence and scope |
|---|---|---|
| 1 Zod | Migrated | Generic UUID/date/input schemas; service/staff/category/customer-profile/schedule actions, booking/waitlist/link/reschedule APIs, intake definition/answer primitives, report ranges. Existing business rules remain in domain and DB. Date rollover regression RED→GREEN. |
| 2 React Hook Form | Migrated | Intake editor uses useForm/useFieldArray/zodResolver, stable library IDs, move/remove/append, validation and pending state. Server action payload/version/linking contract preserved. Simple native forms retained. |
| 3 Resend SDK | Migrated | Existing server-only email provider adapter uses official SDK. Configuration, errors, missing provider ID and truncated idempotency key tested with mocked fetch; no real mail sent. Existing outbox/retry/cancellation untouched. |
| 4 csv-stringify | Migrated | Server-only sync serializer, BOM, CRLF, column order, quoting and escape_formulas. Added tab/CR formula prefix regression RED→GREEN; Unicode/commas/quotes/newlines/empty values tested. |
| 5 Playwright Test | Migrated | Existing scenarios preserved as runner-owned suites, fixtures, retries, trace/video/screenshots/console/URL artifacts. Added four viewport API/intake state/persistence suites. Fixed stale assumption that today always has appointments; choose an active real appointment date. |
| 6 Lucide | Migrated | Nine statically imported named icons behind unchanged WorkspaceIcon API, size/stroke/color/decorative aria behavior preserved. |
| 7 date-fns | Migrated | Generic calendar/report operations use date-fns with official @date-fns/utc context. Date-only arithmetic remains timezone-neutral. Checked Amsterdam, Los Angeles, Kiritimati host TZ, leap/month/week/year/DST boundaries. |
| 8 pg_trgm search | KEEP CURRENT IMPLEMENTATION | Live PostgreSQL 17.11: 15 customers, 21 appointments, 7 services, 5 staff. Tenant customer multi-field ILIKE EXPLAIN ANALYZE execution 0.206 ms; bounded appointment snapshot search 0.289 ms. Both hit two data buffers and zero disk reads. pg_trgm available but not installed. No demonstrated gain from GIN indexes at this dataset size; two-character searches also do not supply a useful full trigram. Preserve bounded tenant queries and defer additive indexing until measured data growth warrants it. |
| 9 Supabase Queues/pgmq | NO-GO | Extension is available but uninstalled. Existing claim function uses FOR UPDATE SKIP LOCKED, atomically increments attempts, reclaims processing jobs after 15 min, bounded batch 1–100; retries and dead/cancelled states already implemented. Live queue has 39 pending/2 cancelled. Switching transports requires lifecycle translation and transition while preserving existing jobs; no reliability or maintainability gain demonstrated. Leave all jobs and schema untouched. |
| 10 Temporal | GO, server-only polyfill | Actual Node 24.19 does not expose native Temporal; CI Node 22 likewise requires polyfill. Pinned official @js-temporal/polyfill 0.5.1. Replaces 361 minute-wise timezone comparisons with ZonedDateTime.from(disambiguation: reject, overflow: reject). Amsterdam skipped/repeated/normal times and Lord Howe half-hour transitions checked. Only server actions/Node route use parser. Same-process 20 normal local resolutions: 127.0 ms before / 11.0 ms after (local microbenchmark, not end-user latency). |

## Package policy

Pinned direct additions: zod 4.6.5 (MIT), react-hook-form 7.89.0 (MIT), @hookform/resolvers 5.9.1 (MIT), resend 6.32.0 (MIT, Node >=20), csv-stringify 6.9.0 (MIT), @playwright/test 1.63.0 (Apache-2.0, Node >=20, dev only), lucide-react 1.51.0 (ISC), @date-fns/utc 2.1.1 (MIT), @js-temporal/polyfill 0.5.1 (ISC). Official npm repository/license/engine/peer metadata and primary documentation reviewed. React Hook Form and Lucide peers support React 19; resolvers supports Zod 4. Official ESM/tree-shakable entry points used. No arbitrary source snippets copied, no existing runtime dependency removed.

Primary docs: https://zod.dev/api ; https://github.com/react-hook-form/resolvers ; https://react-hook-form.com/docs/usefieldarray ; https://github.com/resend/resend-node ; https://csv.js.org/stringify/options/escape_formulas/ ; https://playwright.dev/docs/test-fixtures ; https://lucide.dev/guide/react ; https://github.com/date-fns/utc ; https://github.com/js-temporal/temporal-polyfill .

## Verification and limitations

- Pre-existing incomplete package-lock prevented npm ci; platform dependencies repaired without upgrading application framework.
- Per phase local tests/typecheck/lint/build run; initial suite 80, currently 99 tests. One existing postcss import/no-anonymous-default-export warning remains.
- Live transactional workspace-integration.sql and product-regression.sql passed and rolled back; includes permissions/tenant scope/conflicts/snapshots/intake versions/consent/replay/self-service/outbox behavior.
- Supabase security advisors returned no findings; all exposed public tables have RLS.
- npm audit found one pre-existing underlying braces <=3.0.3 advisory propagated through Next ESLint tooling (five high entries). npm registry's current braces release is still 3.0.3. Audit suggests an incompatible Next lint downgrade; do not force downgrade. Tool consumes checked-in build patterns, not public application inputs. Runtime audit must be recorded separately at final gates.
- Local browser download unavailable; real Chromium testing runs in GitHub Actions with existing secrets, never copied into the repository. Do not mark browser/preview/production complete until the exact final SHA passes.

## Review and bundle verification

Final independent review found no critical defect. Corrected calendar move null-body handling (400 before DB access), restored internal name truncation while retaining waitlist length rejection, and combined Playwright projects so reports cannot overwrite each other. A prior intake test used an exact accessible name that excluded the label hint; its selector is corrected.

The intake client imports Zod Mini and shared field constants without server definition constructors. Same local production-build entry-manifest comparison: intake 16,696 → 47,858 gzip bytes (+31,162); all other workspace routes +1,525 gzip bytes from named Lucide icons; public booking unchanged at 11,550. Before Mini isolation, intake was 123,285 gzip bytes: the optimization removed 75,427 bytes. These are route entry unions including shared/error entries, not measured browser transfer; live resource/LCP/TTFB/navigation gates are still required. Provider, CSV and Temporal remain server-only.

Concurrency coverage now includes booking/booking, block, break, closing exception, staff override, reschedule/booking, stale move, self-service reschedule/booking and cancel replay, three repetitions each in one random tenant; fixture cleanup is mandatory.

Customer profile editing has its own schema because its existing phone (60 characters), free-text email and notes (3,000 characters) differ from booking input. These limits and their rejection boundaries are covered without strengthening contact rules.
