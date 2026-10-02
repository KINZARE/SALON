import { registerHooks } from 'node:module';

// Test-only aliases. Production resolves these with Next.js; secrets and clients
// still use the real server modules and Supabase query serializer in these tests.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/server') return nextResolve('next/server.js', context);
    if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true };
    if (specifier.startsWith('@/')) return { url: new URL(`../../src/${specifier.slice(2)}.ts`, import.meta.url).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
