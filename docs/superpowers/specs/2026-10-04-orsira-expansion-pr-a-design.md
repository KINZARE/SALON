# ORSIRA Expansion PR A Design

## Goal
Deliver the first additive product-expansion slice without rewriting the current workspace: conditional intake fields, stronger consent/signature capture, QR-ready intake links, rebook reminders, post-visit feedback jobs, and waitlist offer tracking.

## Constraints
- Build on current `main` and preserve existing scheduling, snapshots, RLS and no-login preview behavior.
- No direct production release from this branch.
- All database changes are additive and tenant-scoped by `salon_id`.
- Existing notification outbox remains the delivery boundary; no claim of live outbound delivery without configured provider credentials.
- Public intake remains token-based and raw tokens are never stored.
- Conditional fields may only depend on an earlier field in the same form, identified by `sortOrder`; circular dependencies are therefore impossible.
- Hidden conditional fields are not required and their submitted values are discarded server-side.
- Signature capture in this slice is an explicit typed signature/name plus statement/version/time metadata; no handwritten canvas image is stored.
- QR support means a deterministic QR-safe public URL payload is exposed for the existing intake token; rendering may be added without changing token semantics.
- Waitlist offers never auto-book. Offers expire and booking still runs through the existing availability/concurrency path.

## Functional design
### Conditional intake
Each field may include an optional condition `{ sourceSortOrder, operator, value }`. Operators are `equals`, `not_equals`, `is_checked`, `is_not_checked`. The source must be an earlier field. Public rendering evaluates conditions from current answers. Server validation evaluates the same rules and ignores hidden answers.

### Consent/signature
Existing consent records gain optional `signature_name` and `signature_method`; public submission requires the signature name when a consent statement exists. Existing statement text, version and timestamp remain authoritative.

### QR-ready intake links
Issued intake-link data includes the canonical public intake path. The UI can copy/share this path and use it as the QR payload without introducing a second token system.

### Rebook reminders
A rebook policy can be configured per service with an interval in days. After a completed appointment, an idempotent `rebook_reminder` notification job is queued for the calculated due date.

### Feedback
After a completed appointment, an idempotent `feedback_request` notification job is queued. Provider delivery remains disabled when provider configuration is absent.

### Waitlist offers
Matching a waitlist entry may create a time-bounded `waitlist_offer` row with salon, entry, staff, service, start/end and expiry. Offer creation is manual/server-side and never mutates appointments.

## Release gates
- Domain tests for conditions and queue timing.
- Typecheck, lint and production build.
- Supabase security advisor remains clean after migration.
- Browser QA for intake editor/public intake and waitlist workspace before merge.
