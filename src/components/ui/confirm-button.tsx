"use client";
import { Button } from "./button";

export function ConfirmButton({ children, message, variant = "danger" }: { children: React.ReactNode; message: string; variant?: "danger" | "ghost" }) {
  return <Button variant={variant} onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</Button>;
}
