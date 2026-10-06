# Release 1.0 verification

Scope: local shared expenses, no connected external services. User authorized publishing to Render.

- TypeScript, ESLint, 38 unit tests and the static production build passed.
- 15 production Chromium acceptance tests passed: full expense lifecycle; exact, share, percentage and exclusion splits; settlements and undo; receipts/CSV/backup import; snapshot import; quota failure/retry; offline reload and first-visit offline cache; mobile archive; invalid backup; corrupt storage; zero exclusion; long unbroken text up to 1,000,000 currency units at 320/390/768/1440 widths; navigation/editor ownership.
- Additional two-tab stale-editor regression verifies optimistic concurrency and retained form input.
- Independent read-only review found no critical findings. Important findings addressed: stale editor overwrite, numeric zero exclusion, backup size mismatch, incomplete offline shell, unbound modal ownership, transaction timeout and long-name overflow. Minor fixes: archived read-only detail, versioned caches and preserved imported group route.
- Monetary domain uses integer minor units and BigInt intermediate arithmetic. Storage mutations re-read and validate within one atomic transaction; stale full expense edits are rejected.
- Visual screenshots inspected in a desktop/mobile batch; accessibility includes labels, inline alerts, modal focus trapping, reduced motion, skip navigation and 44px controls. Automated testing used Chromium; no claim of full browser or WCAG certification.

Release target: one Render static site from the dedicated deploymentbranch. Live deployment identity and live smoke results are verified separately after publication. No secrets or production user data are included in source.

## Published result

Runtime source commit `d5d555ac0a8ef26cee609ac9086cc6de30d27dbf`; Render service `srv-db2cg8mi0phs73e6fiv0`; deployment `dep-db2cg9ei0phs73e6fkt0` reached live. Public URL: https://shared-money-kwin.onrender.com/. All 51 Git blob hashes matched the locally verified source. SALON main remained unchanged.

Live cloud-browser smoke verified group creation, a 12.00 expense split into 4.00 per person with 8.00 owed back, editing it to 15.00 with 5.00 per person and 10.00 owed back, and reload persistence. The offline and concurrency tests passed against the same production runtime locally. Outbound local Chromium navigation was unavailable; the cloud browser verified the hosted UI. Final publication changes only these release documents; runtime code is unchanged.
