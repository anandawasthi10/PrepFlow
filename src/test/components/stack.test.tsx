import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stack } from "@/components/ui/stack";

describe("Stack component", () => {
  it("renders vertical direction (flex-col) and default spacing (gap-4)", () => {
    render(
      <Stack data-testid="stack-container">
        <div>Item 1</div>
        <div>Item 2</div>
      </Stack>
    );

    const stack = screen.getByTestId("stack-container");
    expect(stack).toBeInTheDocument();
    expect(stack).toHaveAttribute("data-direction", "vertical");
    expect(stack).toHaveAttribute("data-spacing", "4");
    expect(stack).toHaveClass("flex", "flex-col", "gap-4");
  });

  it("renders horizontal direction (flex-row) and custom spacing tokens", () => {
    render(
      <Stack
        direction="horizontal"
        spacing={8}
        align="center"
        justify="between"
        wrap
        data-testid="h-stack"
      >
        <div>Left</div>
        <div>Right</div>
      </Stack>
    );

    const stack = screen.getByTestId("h-stack");
    expect(stack).toHaveAttribute("data-direction", "horizontal");
    expect(stack).toHaveAttribute("data-spacing", "8");
    expect(stack).toHaveClass("flex-row", "gap-8", "items-center", "justify-between", "flex-wrap");
  });
});
