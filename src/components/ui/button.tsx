import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-primary-700 text-white hover:bg-primary-600 shadow-sm active:bg-primary-700",
        secondary:
          "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200",
        outline:
          "border border-primary-700 text-primary-700 bg-transparent hover:bg-primary-100/50",
        ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
        destructive: "bg-error-700 text-white hover:bg-error-700/90 shadow-sm active:bg-error-700",
      },
      size: {
        default: "h-11 px-5 rounded-[10px]",
        sm: "h-9 px-3 text-xs rounded-[8px]",
        lg: "h-12 px-6 text-base rounded-[10px]",
        icon: "h-11 w-11 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        data-variant={variant ?? "default"}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
