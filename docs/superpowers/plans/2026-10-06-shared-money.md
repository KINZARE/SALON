# Shared Money Implementation Plan
> Execution: inline implementation with final independent review, as authorized by the end-to-end build request.

**Goal:** A working shared-expense app deployed on Render without connected services.
**Architecture:** Pure money/domain functions and a validated IndexedDB repository, React task surfaces, static Next.js shell.
**Tech Stack:** Next.js, React, TypeScript, Zod, Vitest, Playwright.
**Spec:** ../specs/2026-10-06-shared-money-design.md

## Global Constraints
No login, Supabase connection, payment processing or subscriptions. Local storage disclosed. Copies never described as synced invites. Cents only. Do not touch existing main branches. 44px targets, reduced motion and mobile layouts.
## Review Focus
Corrupt browser storage: show recovery without replacing data. Concurrent tabs: preserve both writes. Invalid split inputs: prevent saving. Long names: wrap without overflow. Storage failures: retain form and retry.

### Task 1: Monetary and ledger domain
Files: src/lib/types.ts, money.ts, domain.ts, tests/money.test.ts, domain.test.ts.
Interfaces: allocate(amount:number, weights:number[]):number[], parseMinor(value:string):number, getBalances(group:Group):Balance[], suggestTransfers(group:Group):Transfer[], mutate(state:Workspace, action:Action):Workspace.
- [x] Write tests for deterministic cent rounding, exact/percent errors, exclusions and settlement/undo.
- [x] Run tests RED; implement and run GREEN.
### Task 2: Persistence and transport
Files: src/lib/repository.ts, schema.ts, sharing.ts; tests/repository.test.ts, sharing.test.ts.
Interfaces: loadWorkspace():Promise<Workspace>, saveAction(action:Action):Promise<Workspace>, encodeSnapshot(group:Group):string, decodeSnapshot(payload:string):Group.
- [x] Test corrupted data, rollback and concurrent writes, snapshot validation RED; implement GREEN.
### Task 3: App surfaces
Files: src/components/app.tsx, ui.tsx, expense-form.tsx, group-forms.tsx, group-view.tsx, balance-view.tsx, settings-view.tsx; src/app/layout.tsx, page.tsx, globals.css, error.tsx; public/sw.js, manifest.webmanifest.
- [x] Add browser acceptance tests and observe missing UI failures.
- [x] Implement grouped task surfaces, all split modes, local receipts, backup, search, forms with inline errors and save retry.
- [x] Test desktop/mobile/offline/storage failure and inspect screenshots in a batched pass.
### Task 4: Release
Files: render.yaml, README.md, docs/RELEASE.md.
- [x] Typecheck, unit suite, lint and production build.
- [x] Independent review, address blocking findings and retest.
- [x] Publish exact source to dedicated deploy/shared-money branch; create one Render static site.
- [x] Confirm deploy live, then smoke test live core flows and deliver URL.
