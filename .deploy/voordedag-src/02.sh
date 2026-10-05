#!/usr/bin/env bash
set -e
mkdir -p voordedag-app
mkdir -p 'voordedag-app/.'
cat > 'voordedag-app/tsconfig.json' <<'__VDD_2_0_EOF__'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{"name": "next"}],
    "paths": {"@/*": ["./*"]}
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}
__VDD_2_0_EOF__
mkdir -p 'voordedag-app/.'
cat > 'voordedag-app/next.config.ts' <<'__VDD_2_1_EOF__'
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; },
};
export default config;
__VDD_2_1_EOF__
mkdir -p 'voordedag-app/app/api/contact'
cat > 'voordedag-app/app/api/contact/route.ts' <<'__VDD_2_2_EOF__'
import { NextResponse } from "next/server";

const hits = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}
const clean = (v: unknown, max = 2000) => String(v ?? "").trim().slice(0, max);
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid" }, { status: 400 }); }
  if (clean(body.website_url)) return NextResponse.json({ ok: true });
  const data = {
    naam: clean(body.naam, 120), bedrijf: clean(body.bedrijf, 160), email: clean(body.email, 200),
    telefoon: clean(body.telefoon, 40), onderwerp: clean(body.onderwerp, 80), pakket: clean(body.pakket, 40), bericht: clean(body.bericht, 4000),
  };
  if (!data.naam || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email) || !data.onderwerp || data.bericht.length < 10) return NextResponse.json({ error: "validation" }, { status: 422 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL ?? "Voor de Dag <onboarding@resend.dev>";
  if (!key || !to) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const rows = Object.entries(data).filter(([, v]) => v).map(([k, v]) => `<p><strong>${esc(k)}:</strong><br>${esc(v).replace(/\n/g, "<br>")}</p>`).join("");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], reply_to: data.email, subject: `Nieuwe aanvraag: ${data.onderwerp} — ${data.bedrijf || data.naam}`, html: `<h2>Nieuwe websiteaanvraag</h2>${rows}` }),
  });
  if (!res.ok) return NextResponse.json({ error: "send_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
__VDD_2_2_EOF__
mkdir -p 'voordedag-app/app'
cat > 'voordedag-app/app/apple-icon.tsx' <<'__VDD_2_3_EOF__'
import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() {
  return new ImageResponse((<div style={{ width: "100%", height: "100%", background: "#16233A", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFDF7", fontSize: 72, fontWeight: 800 }}>VD</div>), size);
}
__VDD_2_3_EOF__
mkdir -p 'voordedag-app/app/contact'
cat > 'voordedag-app/app/contact/page.tsx' <<'__VDD_2_4_EOF__'
import type { Metadata } from "next";
import { Suspense } from "react";
import { ContactForm } from "@/components/ContactForm";
import { site, whatsappHref } from "@/lib/site";
import { Check } from "@/components/Icons";
export const metadata: Metadata = { title: "Bespreek je website", description: "Vertel kort over je bedrijf. Dan kijken we samen welke website je nodig hebt. Vrijblijvend en zonder technisch gedoe.", alternates: { canonical: "/contact" } };
export default function ContactPage() {
  const wa = whatsappHref();
  return (<section className="section" style={{ paddingTop: "clamp(40px, 7vw, 88px)" }}><div className="container contact-grid"><div><h1>Bespreek je website</h1><p className="intro">Vertel kort over je bedrijf. Dan kijken we samen wat je nodig hebt.</p><ul className="checklist" style={{ marginTop: 28 }}><li><Check />Vrijblijvend: je zit nergens aan vast</li><li><Check />Een persoonlijk antwoord, geen standaardmail</li><li><Check />Eerlijk advies over welk pakket past</li></ul>{site.email || site.phone || wa ? (<div className="stack" style={{ marginTop: 32 }}><p className="muted" style={{ marginBottom: 0 }}>Liever direct contact?</p>{site.email ? <p><a className="textlink" href={`mailto:${site.email}`}>{site.email}</a></p> : null}{site.phone ? <p><a className="textlink" href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a></p> : null}{wa ? <p><a className="btn btn--secondary" href={wa} target="_blank" rel="noopener noreferrer">Stuur een WhatsApp</a></p> : null}</div>) : null}</div><Suspense fallback={<div className="panel" style={{ minHeight: 560 }} />}><ContactForm /></Suspense></div></section>);
}
__VDD_2_4_EOF__
