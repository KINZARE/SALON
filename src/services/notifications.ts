import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { buildNotificationMessage, retryDelayMinutes, type NotificationKind } from "@/domain/notification-copy";
import { sendTransactionalEmail } from "@/services/email-provider";

type NotificationJob = {
  id: string;
  salon_id: string;
  appointment_id: string | null;
  kind: string;
  channel: string;
  recipient: string;
  attempt_count: number;
};

const supportedKinds = new Set<NotificationKind>(["booking_confirmation", "appointment_reminder"]);
const activeStatuses = new Set(["pending", "confirmed", "checked_in"]);

function errorMessage(error: unknown) {
  return (error instanceof Error ? error.message : "UNKNOWN_NOTIFICATION_ERROR").slice(0, 500);
}

async function markCancelled(jobId: string, reason: string) {
  const db = createAdminSupabaseClient();
  const { error } = await db.from("notification_jobs").update({
    status: "cancelled",
    last_error: reason.slice(0, 500),
    updated_at: new Date().toISOString(),
  }).eq("id", jobId);
  if (error) throw error;
}

async function markSent(jobId: string, providerId: string) {
  const db = createAdminSupabaseClient();
  const { data, error: readError } = await db.from("notification_jobs").select("payload").eq("id", jobId).single();
  if (readError) throw readError;
  const payload = data?.payload && typeof data.payload === "object" && !Array.isArray(data.payload) ? data.payload : {};
  const { error } = await db.from("notification_jobs").update({
    status: "sent",
    last_error: null,
    payload: { ...payload, provider: "resend", provider_id: providerId, sent_at: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  }).eq("id", jobId);
  if (error) throw error;
}

async function markFailed(job: NotificationJob, error: unknown) {
  const db = createAdminSupabaseClient();
  const terminal = job.attempt_count >= 8;
  const nextAttempt = new Date(Date.now() + retryDelayMinutes(job.attempt_count) * 60_000).toISOString();
  const { error: updateError } = await db.from("notification_jobs").update({
    status: terminal ? "dead" : "failed",
    last_error: errorMessage(error),
    next_attempt_at: nextAttempt,
    updated_at: new Date().toISOString(),
  }).eq("id", job.id);
  if (updateError) throw updateError;
}

async function processJob(job: NotificationJob) {
  if (job.channel !== "email" || !supportedKinds.has(job.kind as NotificationKind)) {
    await markCancelled(job.id, "UNSUPPORTED_NOTIFICATION_JOB");
    return "cancelled" as const;
  }
  if (!job.appointment_id) {
    await markCancelled(job.id, "APPOINTMENT_REQUIRED");
    return "cancelled" as const;
  }

  const db = createAdminSupabaseClient();
  const [appointmentResult, salonResult] = await Promise.all([
    db.from("appointments")
      .select("id,salon_id,starts_at,status,service_name_snapshot,customer_name_snapshot")
      .eq("id", job.appointment_id)
      .eq("salon_id", job.salon_id)
      .maybeSingle(),
    db.from("salons").select("id,name,timezone").eq("id", job.salon_id).maybeSingle(),
  ]);
  if (appointmentResult.error) throw appointmentResult.error;
  if (salonResult.error) throw salonResult.error;

  const appointment = appointmentResult.data;
  const salon = salonResult.data;
  if (!appointment || !salon) {
    await markCancelled(job.id, "NOTIFICATION_CONTEXT_NOT_FOUND");
    return "cancelled" as const;
  }
  if (job.kind === "appointment_reminder" && !activeStatuses.has(appointment.status)) {
    await markCancelled(job.id, "APPOINTMENT_NO_LONGER_ACTIVE");
    return "cancelled" as const;
  }

  const message = buildNotificationMessage({
    kind: job.kind as NotificationKind,
    salonName: salon.name,
    customerName: appointment.customer_name_snapshot || "klant",
    serviceName: appointment.service_name_snapshot,
    startsAt: appointment.starts_at,
    timezone: salon.timezone,
  });

  const sent = await sendTransactionalEmail({
    to: job.recipient,
    subject: message.subject,
    text: message.text,
    idempotencyKey: `salon/${job.kind}/${job.id}`,
  });
  await markSent(job.id, sent.id);
  return "sent" as const;
}

export async function processDueNotificationJobs(limit = 20) {
  const db = createAdminSupabaseClient();
  const { data, error } = await db.rpc("claim_notification_jobs", { p_limit: Math.max(1, Math.min(limit, 100)) });
  if (error) throw error;

  const jobs = (data ?? []) as NotificationJob[];
  const result = { claimed: jobs.length, sent: 0, failed: 0, cancelled: 0 };

  for (const job of jobs) {
    try {
      const state = await processJob(job);
      if (state === "sent") result.sent += 1;
      else result.cancelled += 1;
    } catch (error) {
      await markFailed(job, error);
      result.failed += 1;
    }
  }

  return result;
}
