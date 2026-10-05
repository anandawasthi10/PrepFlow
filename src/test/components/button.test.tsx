import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button component", () => {
  it("renders with text content and default variant classes", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveClass("bg-primary-700");
  });

  it("renders secondary and destructive variants correctly", () => {
    const { rerender } = render(<Button variant="secondary">Cancel</Button>);
    let button = screen.getByRole("button", { name: /cancel/i });
    expect(button).toHaveAttribute("data-variant", "secondary");
    expect(button).toHaveClass("border-slate-300");

    rerender(<Button variant="destructive">Delete</Button>);
    button = screen.getByRole("button", { name: /delete/i });
    expect(button).toHaveAttribute("data-variant", "destructive");
    expect(button).toHaveClass("bg-error-700");
  });

  it("handles click events via userEvent", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);

    await user.click(screen.getByRole("button", { name: /submit/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("handles keyboard interaction via Enter and Space", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Keyboard</Button>);

    const button = screen.getByRole("button", { name: /keyboard/i });
    button.focus();
    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(1);

    await user.keyboard(" ");
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it("disables the button and shows a spinner when isLoading is true", () => {
    render(<Button isLoading>Saving</Button>);
    const button = screen.getByRole("button", { name: /saving/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("prevents clicks when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole("button", { name: /disabled/i });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
