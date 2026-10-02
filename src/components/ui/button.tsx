import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-[var(--primary)] text-[var(--ink)] hover:bg-[var(--primary-hover)] border-transparent",
  accent: "bg-[var(--secondary)] text-[var(--ink)] hover:bg-[var(--secondary-hover)] border-transparent",
  secondary: "bg-white text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--surface-soft)]",
  ghost: "bg-transparent text-[var(--foreground)] border-transparent hover:bg-[var(--secondary-soft)]",
  danger: "bg-white text-[var(--danger)] border-[#e8c8c3] hover:bg-[#fbefed]",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-[15px]",
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[13px] border font-medium transition duration-200 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
