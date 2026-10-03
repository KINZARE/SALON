"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="mx-auto max-w-lg py-16 text-center"><p className="font-display text-[16px] font-medium tracking-[.1em] text-[var(--primary)]">ORSIRA</p><h1 className="mt-4 text-xl font-semibold">We konden dit scherm niet laden</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Je gegevens zijn niet gewijzigd. Probeer het opnieuw.</p><Button className="mt-5" onClick={reset}>Opnieuw proberen</Button></div>;
}
