import type { ReactNode } from "react";

type AlertVariant = "info" | "error" | "success";

interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
}

const styles: Record<AlertVariant, string> = {
  info: "border-border bg-brand-muted text-foreground",
  error: "border-red-200 bg-red-50 text-red-900",
  success: "border-brand/30 bg-brand-muted text-brand",
};

export function Alert({ children, variant = "info" }: AlertProps) {
  return (
    <p
      className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${styles[variant]}`}
      role="alert"
    >
      {children}
    </p>
  );
}
