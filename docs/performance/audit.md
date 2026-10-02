# SALON runtime, query and cleanup audit

Baseline: production main `ef4c5369117de1742845e219e16626ff9f278ce6`, measured before runtime edits in Actions run 37021920301. Public no-login workspace is the currently authorized product mode.

## Bottlenecks and changes

| Bottleneck | Evidence | Change |
|---|---|---|
| Compute far from database | Vercel `iad1`; Supabase `eu-central-1` | Set and verify `fra1` functions |
| No-login proxy still contains auth refresh | Cookie-bearing proxy can call Supabase getUser; broad matcher | Pass through workspace requests, retain refresh helper for future authenticated mode; exclude public APIs/assets |
| Today reads full staff configuration | 9 requests / 13,642 response bytes on current data | 6 requests / 5,343 bytes; weekday/active/date joins |
| Month loads full appointment detail | 4 requests / 12,328 response bytes | 4 requests / 2,052 bytes; starts_at/status only |
| DnD included in all calendar views | 167,407 transferred JS bytes in mobile baseline | Conditionally import desktop Day board; preserve mobile timeline and desktop interactions |

## Queries and N+1 audit

| Screen | Query stages / bounds | Decision |
|---|---|---|
| App shell | One tenant context shared through React.cache per request | Explicit connection() boundary; no cross-request user cache |
| Today | Context → appointments, staff schedules/breaks/overrides, day opening/exception, spanning day blocks in parallel → optional waitlist | Consolidate staff + day opening; remove non-rendered email/service mapping |
| Day | Context → day appointments, active staff, day blocks, opening/exception, weekday breaks in parallel | Same 6 calls; smaller and correct date-scoped payload |
| Week | Context → one week appointment projection + opening config | Filter selected staff in database; invalid UUID returns empty without DB failure |
| Month | Context → time/status projection, opening config, bounded exceptions in parallel | Preserve timezone day grouping; no new aggregate RPC |
| Customers | Bounded 200 list; detail uses fixed queries with 100-history cap | No per-customer requests; preserve search/profile |
| Services/categories | Fixed parallel service/link/category queries | No per-service fetch loop; public booking/embed staff mapping now batched |
| Staff | Fixed parallel staff/link/schedule/break queries | Management needs full config, keep separate from lean Today projection |
| Reports/CSV | Tenant and period bounds; server-only summary/export, returning customers depends on period result | Already server computed, no client 5,000-row calculation; retain at current 21-row dataset |
| Search | Four parallel tenant-scoped queries, max 10 each; customer lookup max 20 each | Existing indexes and small data do not justify trigram migration |
| Intake | Fixed forms/fields/service links queries; responses and consent limited 25 in profiles | No per-form query loop |
| Public booking | Salon join → service/policy/eligible staff in parallel → seven parallel bounded day reads | Metadata 4→3; eligible staff 2→1; full booking/embed page uses one batched service-to-staff query rather than per-service calls; live availability 13→11, independent reads overlap |
| Waitlist | Entries → service/link queries in parallel; in-memory gap matching | No per-entry database calls; preserve matching eligibility/buffers |
| Notification worker | Deliberately sequential transactional job delivery, bounded claim | Do not parallelize side effects or change cron/idempotency |

The only candidate-staff mutation loop is the intentional conflict retry in no-preference booking. It is not an N+1 read pattern and remains database authoritative. EXPLAIN for the measured month query executed in 0.127ms on current production data; existing tenant/date/staff/customer indexes were sufficient. No schema or migrations changed.

## Cache and rendering decisions

| Data | Policy |
|---|---|
| Tenant identity, salon metadata, server Supabase client | Request-scoped React.cache only; no global session/client |
| Services, categories, staff config, weekly hours | Fresh no-store for now; instant management edits outweigh unmeasured cross-request caching |
| Appointments, availability, payments, waitlist, intake, tokens | Dynamic and no-store; no cached booking authority |
| Fonts, bundled CSS/JS | Existing next/font Urbanist Latin 400/500/600, swap; hashed static assets |

Global app force-dynamic removed. All real workspace data routes remain dynamic through connection() and fresh reads; build verifies auth redirects static. Existing app/loading.tsx provides navigation feedback. Desktop lazy board has an accessible loading status and listens to media changes. Only the primary Calendar link now fully prefetches on unconstrained connections; save-data and slow-2g/2g/3g retain default partial prefetch. This is client router prefetch, not a database availability cache. All existing Calendar revalidatePath/router.refresh mutation paths are preserved. No new cache tags, TTLs, session environment switches, or mutation shortcuts.

## Full route inventory

| Route | Decision | Mode / reason |
|---|---|---|
| `/login` | REDIRECT | Static redirect to /app/today; existing root stays |
| `/signup` | REDIRECT | Static redirect to /app/today; existing root stays |
| `/api/book-link/[token]/availability` | KEEP | Dynamic / secure token checks; no shared token cache |
| `/api/book-link/[token]/book` | KEEP | Dynamic / secure token checks; no shared token cache |
| `/api/cron/notifications` | KEEP | Dynamic / secret-authenticated bounded worker |
| `/api/internal/appointments/[id]/intake-link` | KEEP | Dynamic / fresh server data |
| `/api/internal/appointments/[id]/self-service-link` | KEEP | Dynamic / fresh server data |
| `/api/internal/availability` | KEEP | Dynamic / fresh server data |
| `/api/internal/book` | KEEP | Dynamic / fresh server data |
| `/api/internal/booking-links` | KEEP | Dynamic / fresh server data |
| `/api/internal/customers` | KEEP | Dynamic / fresh server data |
| `/api/internal/move` | KEEP | Dynamic / fresh server data |
| `/api/internal/reports/export` | KEEP | Dynamic / fresh server data |
| `/api/internal/reschedule` | KEEP | Dynamic / fresh server data |
| `/api/public/[salonSlug]/availability` | KEEP | Dynamic / public-safe fields and live availability |
| `/api/public/[salonSlug]/book` | KEEP | Dynamic / public-safe fields and live availability |
| `/api/public/[salonSlug]/waitlist` | KEEP | Dynamic / public-safe fields and live availability |
| `/api/self-service/[token]/availability` | KEEP | Dynamic / secure token checks; no shared token cache |
| `/api/self-service/[token]/cancel` | KEEP | Dynamic / secure token checks; no shared token cache |
| `/api/self-service/[token]/reschedule` | KEEP | Dynamic / secure token checks; no shared token cache |
| `/app/appointments/[id]` | KEEP | Dynamic / fresh server data |
| `/app/appointments/[id]/reschedule` | KEEP | Dynamic / fresh server data |
| `/app/blocks` | KEEP | Dynamic / fresh server data |
| `/app/booking-links` | KEEP | Dynamic / fresh server data |
| `/app/calendar/new` | KEEP | Dynamic / fresh server data |
| `/app/calendar` | KEEP | Dynamic / fresh server data |
| `/app/customers/[id]` | KEEP | Dynamic / fresh server data |
| `/app/customers` | KEEP | Dynamic / fresh server data |
| `/app/intake` | KEEP | Dynamic / fresh server data |
| `/app/intake/submissions/[id]` | KEEP | Dynamic / fresh server data |
| `/app/more` | KEEP | Dynamic / fresh server data |
| `/app/reports` | KEEP | Dynamic / fresh server data |
| `/app/search` | KEEP | Dynamic / fresh server data |
| `/app/services` | KEEP | Dynamic / fresh server data |
| `/app/settings` | KEEP | Dynamic / fresh server data |
| `/app/settings/schedule` | KEEP | Dynamic / fresh server data |
| `/app/settings/widget` | KEEP | Dynamic / fresh server data |
| `/app/staff` | KEEP | Dynamic / fresh server data |
| `/app/today` | KEEP | Dynamic / fresh server data |
| `/app/waitlist` | KEEP | Dynamic / fresh server data |
| `/book/[salonSlug]` | KEEP | Dynamic / public-safe fields and live availability |
| `/book-link/[token]` | KEEP | Dynamic / secure token checks; no shared token cache |
| `/embed/[salonSlug]` | KEEP | Dynamic / public-safe fields and live availability |
| `/intake/[token]` | KEEP | Dynamic / secure token checks; no shared token cache |
| `/manage/[token]` | KEEP | Dynamic / secure token checks; no shared token cache |
| `/onboarding` | REDIRECT | Static redirect to /app/today; existing root stays |
| `/` | REDIRECT | Static redirect to /app/today; existing root stays |

## Proven removals and retained code

| Item | Reference evidence | Result |
|---|---|---|
| Marketing root/components/assets | Current main root already redirects; complete route/component/asset inventory contains no standalone marketing site or public image directory | No marketing page remains; no further product UI removed |
| src/lib/supabase/browser.ts | No imports or dynamic references anywhere in src | Remove orphan browser client; preserve server and future session refresh helpers |
| Direct zod dependency | No src import/reference; runtime schemas already use current domain validators | Remove package.json direct dependency; ESLint may retain it transitively |
| .salon-surface, .salon-float and unused design variables | Whole-source selector/token search had zero references | Remove 21 CSS lines, retain used brand/layout/status tokens |
| Historical migrations / old docs | Applied database history and reference material | Retain; historical preview function creation is followed by removal migrations, not a live runtime route |
| Components/domain logic | Reference inventory found active consumers | Preserve allowlist components, authority, reminders, report export and future auth architecture |

No source component was removed merely because it looked old. No product features or current data were removed.

## Validation and limitations

- Unit tests include request serialization/tenant filters, spanning blocks, DST 25-hour day, exception precedence, no-login cookie handling, server staff filter, calendar historic/late appointment visibility, overlapping availability reads, and batched service/staff mappings.
- Independent code review caught the historic-appointment range regression and malformed staff filter; both have failing-before/passing-after tests.
- Real database rollback suites: workspace-integration.sql and product-regression.sql. Product suite exercises booking, confirmation/reminder outbox, self-service move/cancel, exceptions, intake builder/service links/versioning/consent/replay. Every fixture rolls back; no email is sent.
- Real concurrency harness runs 15 simultaneous races (three each booking/booking, booking/block, booking/exception, move/booking, stale move). Fixture is a random tenant, no contact details, removed in finally; no existing tenant is mutated.
- Browser harness covers 14 workspace routes, drag optimistic update/rejected move rollback, real unchanged settings persistence, public booking service/staff/live-slot/customer form and keyboard focus, CSV download, invalid-token/malformed-booking/worker denial, embed, and all nine requested widths. Screenshots and machine-readable evidence are retained by Actions.
- RLS enabled on all 29 public tables; Supabase security advisor initially reported no lints. Service-role modules remain server-only; no secret is returned to browser.
- Lab observations use GitHub-hosted Chromium without CPU/network throttling. Cold means fresh browser context, not a demonstrated serverless cold start. No field INP, CrUX, server render CPU span, or isolated causal attribution is claimed.
- The expanded browser test also caught and fixed a pre-existing booking effect that cleared the selected slot on entry to the customer form; availability is now fetched only while choosing a time. Final submission still revalidates live availability and uses the atomic booking RPC.
- Existing list caps and returning-customer 5,000-history cap remain a larger-dataset limitation; revisit with measured growth. Current data is small. One existing PostCSS lint warning remains (zero errors).
- Earlier singular relationship normalization and spanning-block desktop rendering behavior are pre-existing limitations; this change preserves appointment authority and scope.
