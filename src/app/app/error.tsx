"use client";

import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-14 text-center sm:py-20">
      <span className="mx-auto block h-2 w-2 rounded-full bg-[var(--danger)]" aria-hidden="true" />
      <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">We konden dit scherm niet laden</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
        Je gegevens zijn niet gewijzigd. Probeer het opnieuw.
      </p>
      <Button className="mt-6" onClick={reset}>Opnieuw proberen</Button>
    </div>
  );
}
