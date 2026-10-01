import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "border-transparent bg-[var(--ink)] text-white hover:bg-[#242424]",
  secondary: "border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-[var(--surface)]",
  ghost: "border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--surface)]",
  danger: "border-[#e7c3bd] bg-white text-[var(--danger)] hover:bg-[#fff7f5]",
};

const sizes = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-[15px]",
};

export function Button({ variant = "primary", size = "md", className = "", ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[var(--radius-pill)] border font-medium tracking-[-0.01em] transition-[transform,background-color,border-color,color,opacity] duration-200 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
