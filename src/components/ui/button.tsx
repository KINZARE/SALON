import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] border-transparent",
  secondary: "bg-white text-[var(--foreground)] border-[var(--border)] hover:bg-[#f3f3f0]",
  ghost: "bg-transparent text-[var(--foreground)] border-transparent hover:bg-[#ededE9]",
  danger: "bg-white text-[var(--danger)] border-[#efc7c2] hover:bg-[#fff5f4]",
};
const sizes = { sm: "h-9 px-3 text-sm", md: "h-11 px-4 text-sm", lg: "h-12 px-5 text-[15px]" };

export function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[11px] border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
