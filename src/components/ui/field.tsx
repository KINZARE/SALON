import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      <input className="h-11 w-full rounded-[11px] border border-[var(--border)] bg-white px-3.5 text-[15px] outline-none transition focus:border-[#94b9ae]" {...props} />
      {hint ? <span className="text-xs font-normal text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}

export function TextAreaField({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      <textarea className="min-h-24 w-full resize-y rounded-[11px] border border-[var(--border)] bg-white px-3.5 py-3 text-[15px] outline-none transition focus:border-[#94b9ae]" {...props} />
    </label>
  );
}
