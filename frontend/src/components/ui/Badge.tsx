import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "error";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        {
          "bg-primary text-surface-subtle hover:bg-primary-hover": variant === "default",
          "bg-surface-muted text-text hover:bg-border": variant === "secondary",
          "text-text border border-border": variant === "outline",
          "bg-success/10 text-success border border-success/20": variant === "success",
          "bg-error/10 text-error border border-error/20": variant === "error",
        },
        className
      )}
      {...props}
    />
  );
}
