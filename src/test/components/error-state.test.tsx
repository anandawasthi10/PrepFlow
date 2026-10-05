import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "@/components/ui/error-state";

describe("ErrorState component", () => {
  it("renders with role=alert, default title, and error message", () => {
    render(<ErrorState message="Could not connect to processing service." />);
    const alertBox = screen.getByRole("alert");
    expect(alertBox).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Could not connect to processing service.")).toBeInTheDocument();
  });

  it("renders retry button when onRetry is provided and triggers callback on click", async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();

    render(
      <ErrorState
        title="Upload Failed"
        message="File exceeds size limit."
        onRetry={handleRetry}
        retryLabel="Upload Again"
      />
    );

    const retryButton = screen.getByRole("button", { name: /upload again/i });
    expect(retryButton).toBeInTheDocument();

    await user.click(retryButton);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
