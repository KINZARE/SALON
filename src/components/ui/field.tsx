import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const control = "w-full rounded-[10px] border border-[var(--border)] bg-white text-[15px] outline-none transition placeholder:text-[var(--subtle)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]";

export function Field({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      <input className={`h-11 px-3.5 ${control}`} {...props} />
      {hint ? <span className="text-xs font-normal leading-5 text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}

export function TextAreaField({ label, hint, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <span>{label}</span>
      <textarea className={`min-h-24 resize-y px-3.5 py-3 ${control}`} {...props} />
      {hint ? <span className="text-xs font-normal leading-5 text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}
