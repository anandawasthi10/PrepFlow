import * as React from "react";
import { cn } from "@/lib/utils";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "vertical" | "horizontal";
  spacing?: 1 | 2 | 3 | 4 | 6 | 8 | 10 | 12;
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
}

export function Stack({
  direction = "vertical",
  spacing = 4,
  align,
  justify,
  wrap = false,
  className,
  children,
  ...props
}: StackProps) {
  const spacingClasses: Record<number, string> = {
    1: "gap-1",
    2: "gap-2",
    3: "gap-3",
    4: "gap-4",
    6: "gap-6",
    8: "gap-8",
    10: "gap-10",
    12: "gap-12",
  };

  const alignClasses = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
  };

  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };

  return (
    <div
      className={cn(
        "flex",
        direction === "vertical" ? "flex-col" : "flex-row",
        spacingClasses[spacing] ?? "gap-4",
        align && alignClasses[align],
        justify && justifyClasses[justify],
        wrap && "flex-wrap",
        className
      )}
      data-direction={direction}
      data-spacing={spacing}
      {...props}
    >
      {children}
    </div>
  );
}
