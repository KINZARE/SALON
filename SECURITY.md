# Security baseline

- Tenant data is scoped by `salon_id`, composite foreign keys where appropriate, RLS and server authorization.
- Public clients never receive the Supabase service-role key.
- Public booking mutations run through trusted server code and `create_appointment_atomic`.
- Appointment overlap protection is a PostgreSQL exclusion constraint, not a frontend check.
- Price, duration, currency, payment state and tenant identity are authoritative server/database data.
- Staff access is intentionally narrower than owner/manager access; customer name is snapshotted on appointments so staff do not need broad customer-table access.
- Payment and notification providers must verify signed webhooks, use idempotency and log failures without storing secrets or sensitive payloads.
- Add rate limiting/WAF rules to public booking and auth endpoints before public launch.
