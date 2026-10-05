import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary-100 text-primary-700 border border-primary-700/20",
        secondary: "bg-slate-100 text-slate-700 border border-slate-300",
        success: "bg-success-100 text-success-700 border border-success-700/20",
        warning: "bg-warning-100 text-warning-700 border border-warning-700/20",
        error: "bg-error-100 text-error-700 border border-error-700/20",
        outline: "text-slate-700 border border-slate-300 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      data-variant={variant ?? "default"}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
