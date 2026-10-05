import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingState } from "@/components/ui/loading-state";

describe("LoadingState component", () => {
  it("renders with role=status, default message, and accessible loading label", () => {
    render(<LoadingState />);
    const statusContainer = screen.getByRole("status");
    expect(statusContainer).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByText("Loading", { selector: ".sr-only" })).toBeInTheDocument();
  });

  it("renders custom message correctly", () => {
    render(<LoadingState message="Extracting question bank..." size="lg" />);
    expect(screen.getByText("Extracting question bank...")).toBeInTheDocument();
  });
});
