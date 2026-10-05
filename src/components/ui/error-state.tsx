import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retryLabel = "Try again",
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-[14px] border border-error-100 bg-error-100/30",
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-100 text-error-700 mb-3">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <h4 className="text-base font-semibold text-slate-950 mb-1">{title}</h4>
      <p className="text-sm text-slate-600 max-w-md mb-5">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
