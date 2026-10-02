import { getStatusMeta } from "@/lib/calendar-ui";

const toneClass = {
  info: "border-[#ccdde1] bg-[#e8f0f2] text-[#48676f]",
  warning: "border-[#ead5a9] bg-[#f7ecd4] text-[#7a5a1f]",
  success: "border-[#cbdccd] bg-[#e5eee7] text-[#42654e]",
  complete: "border-[#d8d3cb] bg-[#ebe9e5] text-[#4b4945]",
  danger: "border-[#e8c6c1] bg-[#f8e7e4] text-[#9b4338]",
  muted: "border-[#dedbd5] bg-[#efeeeb] text-[#77736d]",
} as const;

export function StatusChip({ status }: { status: string }) {
  const meta = getStatusMeta(status);
  return <span data-status-chip className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${toneClass[meta.tone]}`}>{meta.label}</span>;
}
