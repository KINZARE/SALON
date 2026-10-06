# Shared Money
People travelling, living or eating together should add shared expenses in seconds and understand exactly why money is owed. This release is a working local-first app, explicitly without Supabase, login, bank connections, payment processing or subscriptions.

Data is stored in IndexedDB on the device. Shared links contain an immutable group snapshot, excluding receipts, and must say they are copies without live sync. Cross-tab updates use browser storage events/BroadcastChannel. No claim of cross-device collaboration. Backups allow recovery and transfer.

Core: create groups, names/members, quick expenses, exclusions, equal/shares/exact/percentage allocations, correct integer cents, derived balances, transfers recorded as ledger events, edit, soft delete and undo, history, search, receipt attachments, CSV and JSON export, snapshot import. Optional sample group is explicitly labelled and user-triggered. No data seeded silently. No dead future integration controls.

Currencies each have two minor-unit digits. Groups cannot change currency once expenses/payments exist. No automatic FX or AI extraction in this release. Backend can later implement the WorkspaceRepository contract with server authorization and audited mutations.
