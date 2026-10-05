# ORSIRA daily core simplification — 5 October 2026

Baseline main: `33c43333cca60846d67d0c9516e194395d487996`. Vercel production READY at baseline. Draft expansion PR #17 remains separate; no expansion migrations included. Open historical workflow PR #13 remains untouched.

Primary priority: easier daily work. Supporting priorities: shorter core flows and less visible noise. Park new modules, auth, staff permission changes, new KPI semantics and popularity rankings without source data.

Applied uploaded Kwin App Builder, High-End Web Designer, ORSIRA Commander/Experience/Platform/KPI/Release roles, BOEKUNA Product Strategy/Priority Coach/Activation/Retention and Metrics measurement principles; existing Bukuna-inspired light-green tokens, Inter/Manrope, reduced-motion/focus foundation retained. Brand Director/Application/Color/Typography/Creative Direction/Guidelines used as application audit, not rebrand. No new fonts, dependencies or decorative animation.

| Screen | Primary task/action | Visible excess | Decision | Advanced destination |
|---|---|---|---|---|
| Today | Next appointment / new appointment | 5 KPI cells, 4 header actions | SIMPLIFY: next first, compact summary, one create action | Contextual Agenda and More |
| Agenda day | Plan/move appointment | Header exceptions, repeated panel metadata | SIMPLIFY: Open + Move, smaller panel | More details / More |
| Agenda week | Scan staff week | Repeated filters | KEEP; preserve staff query when switching views | Day context |
| Agenda month | Find day | Existing count overview | KEEP | Day detail |
| Appointment detail | Move / status | Cancel, no-show, token links immediately visible | MOVE; confirm destructive actions | More actions |
| Appointment create | Customer → treatment → time → save | Customer last, locked contact inputs, note | SIMPLIFY; one eligible staff selected | More options |
| Customers | Find customer | Generic explanatory copy | SIMPLIFY; accessible search | Customer profile |
| Customer detail | Rebook | KPI grid before visits, always visible editor/empty intake | SIMPLIFY; next/last first; rebook label | Edit disclosure; relevant dossier only |
| Reports | Understand outcome | Six primary metrics, two trends, custom date form | SIMPLIFY to 4 trusted metrics, one trend | More details / other period |
| More | Occasional tasks | Mixed planning/management groups | MOVE into Salon / Bookings / Insight / Settings | Existing routes |
| Settings | Hours/profile/booking rules | Technical headings | SIMPLIFY task labels; preserve all fields | Existing form |
| Public booking | Complete booking | Strong proven flow | DO NOT TOUCH | Existing booking steps |

Protected: availability, atomic RPC, concurrency, RLS, tenant scope, timezones, public tokens, snapshots, financial definitions and CSV. No service/server/API/database changes.

Exceptions supported by code: staff has no Customers/create authorization, so keep 3 authorized daily links; current no-login runtime supplies owner context. No staff fixture claim. Report occupancy is not available in current report service, so choose completed value, planned value, appointment count and no-show rate. Customers source is alphabetical with no visit-recency data: do not fabricate recent visitors.

Baseline tests: 102 passed. UX changes need exact-head browser evidence and production smoke before DONE.
