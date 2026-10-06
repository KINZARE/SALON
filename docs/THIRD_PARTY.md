# Dependencies and references

Runtime dependencies are declared and pinned by package-lock.json: Next.js/React, Zod, Lucide icons and DM Sans through Fontsource. Their license notices remain available in the installed packages. No dependency source is vendored.

Spliit's public `shares.ts` and `balances.ts` were read as product/algorithm references. This implementation uses independently written typed domain functions, integer cents, BigInt intermediates and deterministic largest-remainder allocation. No Spliit code was copied.

The provided Kwin App Builder skill pack guided product/design/verification work. It is not included as app source. Supabase, payment providers and bank APIs are not installed or connected.
