import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("Badge component", () => {
  it("renders with default variant classes", () => {
    render(<Badge>Default Badge</Badge>);
    const badge = screen.getByText("Default Badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-variant", "default");
    expect(badge).toHaveClass("bg-primary-100", "text-primary-700");
  });

  it("renders success variant for correct answers", () => {
    render(<Badge variant="success">Correct</Badge>);
    const badge = screen.getByText("Correct");
    expect(badge).toHaveAttribute("data-variant", "success");
    expect(badge).toHaveClass("bg-success-100", "text-success-700");
  });

  it("renders warning variant for revision due", () => {
    render(<Badge variant="warning">Revision Due</Badge>);
    const badge = screen.getByText("Revision Due");
    expect(badge).toHaveAttribute("data-variant", "warning");
    expect(badge).toHaveClass("bg-warning-100", "text-warning-700");
  });

  it("renders error variant for incorrect answers", () => {
    render(<Badge variant="error">Incorrect</Badge>);
    const badge = screen.getByText("Incorrect");
    expect(badge).toHaveAttribute("data-variant", "error");
    expect(badge).toHaveClass("bg-error-100", "text-error-700");
  });

  it("renders secondary and outline variants", () => {
    const { rerender } = render(<Badge variant="secondary">Secondary</Badge>);
    let badge = screen.getByText("Secondary");
    expect(badge).toHaveAttribute("data-variant", "secondary");
    expect(badge).toHaveClass("bg-slate-100");

    rerender(<Badge variant="outline">Outline</Badge>);
    badge = screen.getByText("Outline");
    expect(badge).toHaveAttribute("data-variant", "outline");
    expect(badge).toHaveClass("border-slate-300");
  });
});
