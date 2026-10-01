# Salon SaaS

Production-oriented foundation for a small-salon booking and management product. The first commercial niche can be Thai massage salons, while the data model and product flows remain generic for appointment-driven salons.

## Core implemented

- Supabase Auth SSR wiring and role-aware multi-tenant RLS.
- Atomic salon onboarding: salon, owner membership, opening hours, first service, first staff member and schedules.
- Mobile-first Today, Calendar, Customers, Services, Staff, Blocks, Reports and Settings.
- Owner service/staff management, opening hours and booking settings; owner/manager operational blocks.
- Customer profiles with appointment history and simple internal notes.
- Public booking: service → staff/no preference → date/time → details → confirmation.
- Central availability domain logic for opening hours, staff schedule, breaks, blocks, appointments, duration and buffer.
- PostgreSQL exclusion constraint preventing overlapping staff bookings, including buffer time.
- Atomic booking RPC using authoritative service price/duration snapshots.
- Internal appointment creation, status transitions and atomic rescheduling of the same appointment.
- Customer/service snapshots and appointment event history.
- Payment architecture with server-owned payment status; no client-controlled paid flag.
- Notification outbox so email/WhatsApp/SMS delivery can fail without deleting the appointment.
- Designed loading, empty and error states on the main booking and app surfaces; global app errors expose retry.

## Run locally

1. Create/connect a Supabase project.
2. Apply `supabase/migrations/0001_core.sql`.
3. Copy `.env.example` to `.env.local` and add the Supabase URL, anon key and service-role key.
4. Install dependencies with `npm install`.
5. Run `npm test`, `npm run typecheck`, `npm run build`, then `npm run dev`.

The service-role key is server-only. Never expose it with `NEXT_PUBLIC_` or commit it.

## Release blockers

Do not deploy if double booking, tenant leakage, authorization bypass, invalid availability, incorrect snapshots, unsafe payment status, timezone/DST errors, failed migrations, broken mobile booking, typecheck/build failures, or leaked secrets are known.

## Runtime

SALON runs only against the connected Supabase backend. Workspace access requires a real authenticated user and salon membership. Public booking reads and writes the real salon data; there is no synthetic or demo runtime mode.
