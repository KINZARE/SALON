# Operational workspace execution checkpoint

The verification environment disconnected with `409 environment_offline: Environment is not connected` before source publication and Vercel deployment. This branch is a recovery checkpoint, **not a completed workspace release**.

Base: `8e72384516e8b0cc6a3a3441f243cc0b8a14f7e7`.
Local implementation commit: `31fdec21e6a3f19b5a3f8fc75cbbb4772ad6f2db`, plus the review fixes described below. The application source remains in the disconnected workspace at `/workspace/scratch/35db77f625ed/salon` and has not been uploaded to this remote branch.

## Completed evidence
- Operational Today, calendar with dnd-kit drag/drop and validated undo, appointment/customer/team/service editors, recurring breaks, blocks, settings, reports and search implemented locally. Marketing files unchanged.
- Domain tests: 25 passed, 0 failed after DST and schedule-conflict fixes.
- Typecheck, lint (0 errors, 7 pre-existing warnings) and production build passed before the last review fixes; must rerun on final source.
- Database rollback integration passed role/tenant isolation, owner/manager CRUD, staff appointment/customer scope, overlap, adjacent buffer boundaries, snapshots, stale move, blocks and terminal statuses.
- Two simultaneously submitted atomic booking calls produced one success and one 23P01/SLOT_JUST_BOOKED; database count 1. Isolated fixtures were removed.
- Four additive migrations applied to Supabase project pqozwzakdqtueunictid. Their exact source is included here. Security advisor after fixture cleanup: zero findings.
- Browser flows previously exercised create/persist/refresh, session isolation, phone/email search, explicit move, pointer move across employees/time, validated undo, invalid drop rollback, breaks, blocks, working-hours rejection, service snapshot preservation, staff schedules/breaks/deactivation, settings and cancellation.
- Full final browser/responsive pass and live Vercel Preview verification are **not complete**.

## Review fixes and remaining verification
Read-only independent review found block/config versus booking serialization, selected-customer contact leakage, ambiguous DST slots, conflicting future schedule changes, draft dismissal, capped customer lookup, and stale undo refresh. Local fixes added shared salon transaction locks; future schedule conflict rejection; contact reset; ambiguous-slot filtering; dirty-dialog guards and non-destructive search shortcut; direct/referenced-customer reads and server search; refresh on conflict.

The last QA runner was `qa/local-run.mjs`, with output `/tmp/salon-browser-qa10.log`. It was starting when the environment disconnected. Recover its output and inspect the latest git status before proceeding.

Required next steps: finish review-fix regressions, typecheck/lint/build, actual concurrent block-versus-book/move database test, all browser flows, widths 320/360/375/390/430/768/1024/1280/1440, publish the full source branch, open PR, run branch-specific workspace-preview workflow, verify Vercel READY and exact GitHub SHA, inspect live screenshots/results. Do not merge or deploy production. Never expose real customer data in the no-login preview.
