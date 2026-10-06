# One-screen-day release

Active production: Render `srv-db1pnt2d0e5s738s2ivg`, https://orsira-salon-preview.onrender.com. Automatic deploys are disabled; existing release branch `experience/orsira-simplicity-daily-core`. The historical Vercel deployment is not the current target.

Candidate preview: Render `srv-db2d4oe7bikc73dbps5g`, https://orsira-one-screen-day.onrender.com, branch `feature/orsira-one-screen-day`, automatic deploys disabled. Manually deploy its recorded head. CI requires `/api/release` to match the candidate before hosted QA.

Before merge: clean install, tests, typecheck, lint, build, additive DB regressions with authenticated RLS, concurrency, local/exact-head hosted Playwright, responsive/accessibility and performance comparison, independent review with no important findings. Recheck main and PR head, then merge with an expected-head lease.

After merge `orsira-guarded-production` checks that main's complete tree equals the exact candidate tree and all three candidate gate jobs succeeded. After this guard passes, fast-forward the existing Render release branch to the authorized main SHA, recheck it, and trigger the existing service. Never force the branch or deploy an untested tree.

Verify Render status `live` and its commit ID independently, then require production `/api/release` to return main's SHA. Production repeats the synthetic workday, 390/1440 contexts and public booking/responsive checks. Random test fixture IDs are removed in `finally`; no real contacts or payments. Keep the previous live deployment as rollback target; schema remains backwards compatible.
