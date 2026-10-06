# ORSIRA one-screen day

Base main: c9b39429c52bc734930b9c3dedc1064c5029bcc6. User authorizes autonomous design, implementation, review, merge and production verification. This written specification follows the supplied complete prompt; no additional approval loop is needed.

Today owns a single selected context: appointment, customer, intake, booking, rescheduling, or day block. Desktop uses planning and a context panel; below 1024px the same panel becomes a native modal bottom sheet with focus trapping, Escape and focus return. No overlay stacking or daily route changes. One primary action; rebook/move/customer are secondary and rare actions live under More.

Existing server primitives remain authoritative: createInternalBooking, AvailabilityService, moveWorkspaceAppointment, saveWorkspaceEntity and transition_appointment_status. Add treatment_started_at to appointments and a tenant-scoped compare-and-set RPC; do not change appointment enum or active occupancy predicates. Checked-in appointments stay capacity-protected while being treated. A daily break is a one-off block with reason Pauze. Payment values are read-only unless the existing implementation supports manual truth; no new payment integration or invented paid flag.

Details load only on selection, booking catalog only when opening a booking/block context. Appointment notes use compare-and-set protection. Intake detail remains in context. Waitlist candidates appear under their matching gap, with authoritative availability rechecked before any booking. Existing no-login synthetic salon mode remains; roles in UI must match existing server capability (owner/manager mutations, staff read-only). Do not claim authenticated multi-user readiness while this mode is in use.

Current/next selection uses server timestamps, active status, no terminal appointments, and stable sorting. Every appointment and gap has an accessible button. Full day includes blocks and recurring breaks. A refresh restores selected appointment via query string; no customer PII in URL. Server mutations revalidate Today and Calendar and re-read truth after failures.

Quality gates: clean install, unit tests, typecheck, lint, build, isolated DB regression/concurrency and RLS/advisors, real Playwright workday/negative flows, widths 320/360/375/390/430/768/1024/1280/1440, keyboard/focus, no console/network/hydration errors, noise pass and before/after performance. Exact-head hosted preview must pass before merge. Existing guarded production workflow must prove main SHA and alias, then live browser smoke. No real customer test writes.
