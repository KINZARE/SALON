import { getStatusMeta } from "@/lib/calendar-ui";

const toneClass = {
  info: "border-[var(--border)] bg-[var(--surface-soft)] text-[#625d58]",
  warning: "border-[#e6d6b5] bg-[#f7efdf] text-[#76561f]",
  success: "border-[#ccd7c7] bg-[var(--secondary-soft)] text-[#52664d]",
  complete: "border-[#d9d4cc] bg-[#f1efec] text-[#56514d]",
  danger: "border-[#e5c6c2] bg-[#f8e9e7] text-[#8f3c35]",
  muted: "border-[#ddd8d2] bg-[#f3f1ee] text-[#77716b]",
} as const;

export function StatusChip({ status }: { status: string }) {
  const meta = getStatusMeta(status);
  return <span data-status-chip className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${toneClass[meta.tone]}`}>{meta.label}</span>;
}
