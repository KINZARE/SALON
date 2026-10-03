import "server-only";
import { Resend } from "resend";

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

  const { data, error } = await new Resend(apiKey).emails.send({
    from,
    to: [input.to],
    subject: input.subject,
    text: input.text,
  }, { idempotencyKey: input.idempotencyKey.slice(0, 256) });

  if (error) throw new Error(`EMAIL_SEND_FAILED:${error.message || error.name}`);
  if (!data?.id) throw new Error("EMAIL_SEND_FAILED:MISSING_PROVIDER_ID");
  return { provider: "resend" as const, id: data.id };
}
