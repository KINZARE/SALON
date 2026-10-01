"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  primaryHref: string;
  primaryLabel: string;
};

const links = [
  ["Product", "#product"],
  ["Hoe het werkt", "#booking"],
  ["Voor salons", "#salons"],
] as const;

export function MarketingHeader({ primaryHref, primaryLabel }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="mx-auto flex min-h-14 max-w-[88rem] items-center justify-between gap-4 rounded-[var(--radius-pill)] border border-black/5 bg-white/92 px-4 shadow-[0_14px_45px_rgba(17,17,17,0.07)] backdrop-blur-xl sm:px-5">
          <Link href="/" className="flex min-h-11 items-center gap-2.5" aria-label="SALON home">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink)] text-[10px] font-semibold tracking-[0.08em] text-white">S</span>
            <span className="text-sm font-semibold tracking-[-0.03em]">SALON</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Website">
            {links.map(([label, href]) => (
              <a key={href} href={href} className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={primaryHref}
              className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--ink)] px-4 text-xs font-medium text-white sm:text-sm"
            >
              {primaryLabel}
            </Link>
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--surface)] px-3 text-xs font-medium md:hidden"
              aria-expanded={open}
              aria-controls="mobile-site-menu"
              onClick={() => setOpen(true)}
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div id="mobile-site-menu" className="fixed inset-0 z-50 flex flex-col bg-[var(--ink)] p-5 text-white md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold tracking-[-0.03em]">SALON</span>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/10 text-sm"
              onClick={() => setOpen(false)}
              aria-label="Menu sluiten"
            >
              ×
            </button>
          </div>

          <nav className="mt-20 grid gap-3" aria-label="Mobiele website navigatie">
            {links.map(([label, href], index) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-end justify-between border-b border-white/15 py-4 text-4xl font-medium tracking-[-0.055em]"
              >
                <span>{label}</span>
                <span className="pb-1 text-sm text-[var(--accent-light)]">0{index + 1}</span>
              </a>
            ))}
          </nav>

          <div className="mt-auto">
            <Link
              href={primaryHref}
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-[var(--radius-pill)] bg-white px-5 text-sm font-medium text-[var(--ink)]"
            >
              {primaryLabel}
            </Link>
            <p className="mt-5 text-xs leading-5 text-white/45">Rust in je planning. Meer aandacht voor je salon.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
