import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: "sm" | "default" | "lg";
}

export function LoadingState({
  message = "Loading...",
  size = "default",
  className,
  ...props
}: LoadingStateProps) {
  const iconSizes = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center justify-center p-8 text-center", className)}
      {...props}
    >
      <Loader2
        className={cn("animate-spin text-primary-700 mb-3", iconSizes[size])}
        aria-hidden="true"
      />
      <span className="text-sm font-medium text-slate-700">{message}</span>
      <span className="sr-only">Loading</span>
    </div>
  );
}
