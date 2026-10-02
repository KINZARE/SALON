import "server-only";

export type TransactionalEmail = {
  to: string;
  subject: string;
  text: string;
  idempotencyKey: string;
};

export function isEmailDeliveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export async function sendTransactionalEmail(input: TransactionalEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("EMAIL_PROVIDER_NOT_CONFIGURED");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey.slice(0, 256),
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });

  const body = await response.json().catch(() => null) as { id?: string; message?: string; name?: string } | null;
  if (!response.ok) {
    const detail = body?.message || body?.name || `HTTP_${response.status}`;
    throw new Error(`EMAIL_SEND_FAILED:${detail}`);
  }

  if (!body?.id) throw new Error("EMAIL_SEND_FAILED:MISSING_PROVIDER_ID");
  return { provider: "resend" as const, id: body.id };
}
