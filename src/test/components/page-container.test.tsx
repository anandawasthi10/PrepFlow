import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageContainer } from "@/components/ui/page-container";

describe("PageContainer component", () => {
  it("renders with default max-width (max-w-7xl) and responsive gutters", () => {
    render(<PageContainer data-testid="page-container">Content</PageContainer>);
    const container = screen.getByTestId("page-container");
    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute("data-size", "default");
    expect(container).toHaveClass("max-w-7xl", "px-4", "md:px-6", "lg:px-8");
  });

  it("renders practice size with max-w-[760px] constraint", () => {
    render(
      <PageContainer size="practice" data-testid="practice-container">
        Practice Question Content
      </PageContainer>
    );
    const container = screen.getByTestId("practice-container");
    expect(container).toHaveAttribute("data-size", "practice");
    expect(container).toHaveClass("max-w-[760px]");
  });

  it("renders narrow and full size modes", () => {
    const { rerender } = render(
      <PageContainer size="narrow" data-testid="narrow-container">
        Narrow
      </PageContainer>
    );
    let container = screen.getByTestId("narrow-container");
    expect(container).toHaveClass("max-w-3xl");

    rerender(
      <PageContainer size="full" data-testid="full-container">
        Full
      </PageContainer>
    );
    container = screen.getByTestId("full-container");
    expect(container).toHaveClass("max-w-full");
  });
});
