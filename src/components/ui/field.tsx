import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const inputClassName =
  "min-h-11 w-full rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-3.5 text-[15px] text-[var(--foreground)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(177,95,44,0.10)] disabled:cursor-not-allowed disabled:bg-[var(--surface)] disabled:text-[var(--muted)]";

export function Field({
  label,
  hint,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
      <span>{label}</span>
      <input className={`${inputClassName} ${className}`} {...props} />
      {hint ? <span className="text-xs font-normal leading-5 text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}

export function TextAreaField({
  label,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--foreground)]">
      <span>{label}</span>
      <textarea
        className={`min-h-28 w-full resize-y rounded-[var(--radius-control)] border border-[var(--line)] bg-white px-3.5 py-3 text-[15px] leading-6 text-[var(--foreground)] outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_rgba(177,95,44,0.10)] disabled:cursor-not-allowed disabled:bg-[var(--surface)] ${className}`}
        {...props}
      />
    </label>
  );
}
