import * as React from "react";
import { cn } from "@/lib/utils";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "practice" | "narrow" | "full";
}

export function PageContainer({
  size = "default",
  className,
  children,
  ...props
}: PageContainerProps) {
  const sizeClasses = {
    default: "max-w-7xl",
    practice: "max-w-[760px]",
    narrow: "max-w-3xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn(
        "w-full mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8",
        sizeClasses[size],
        className
      )}
      data-size={size}
      {...props}
    >
      {children}
    </div>
  );
}
