#!/usr/bin/env bash
set -e
mkdir -p voordedag-app
mkdir -p 'voordedag-app/.'
cat > 'voordedag-app/package.json' <<'__VDD_0_0_EOF__'
{
  "name": "voordedag-website",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@fontsource-variable/inter": "5.3.0",
    "@fontsource-variable/manrope": "5.3.0",
    "@fontsource/inter": "5.3.0",
    "@fontsource/manrope": "5.3.0",
    "lenis": "1.3.26",
    "next": "16.3.8",
    "react": "19.2.0",
    "react-dom": "19.2.0"
  },
  "devDependencies": {
    "@types/node": "22.10.0",
    "@types/react": "19.2.2",
    "@types/react-dom": "19.2.2",
    "typescript": "5.9.3"
  },
  "engines": {
    "node": ">=20"
  }
}
__VDD_0_0_EOF__
