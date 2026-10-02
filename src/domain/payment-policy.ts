export type ServicePaymentMode = "pay_in_salon" | "deposit" | "full_payment";

export function normalizePaymentPolicy({
  mode,
  depositCents,
  priceCents,
}: {
  mode: string;
  depositCents: number | null;
  priceCents: number;
}): { mode: ServicePaymentMode; depositCents: number | null } {
  if (!Number.isInteger(priceCents) || priceCents < 0) throw new Error("INVALID_PRICE");

  if (mode === "pay_in_salon" || mode === "none") {
    return { mode: "pay_in_salon", depositCents: null };
  }
  if (mode === "full_payment") {
    return { mode: "full_payment", depositCents: null };
  }
  if (mode === "deposit") {
    if (!Number.isInteger(depositCents) || depositCents === null || depositCents <= 0 || depositCents > priceCents) {
      throw new Error("INVALID_DEPOSIT");
    }
    return { mode: "deposit", depositCents };
  }
  throw new Error("INVALID_PAYMENT_MODE");
}
