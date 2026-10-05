import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

describe("Card component hierarchy", () => {
  it("renders card and all sub-components with proper semantic roles and classes", () => {
    render(
      <Card data-testid="test-card">
        <CardHeader>
          <CardTitle>Card Heading</CardTitle>
          <CardDescription>Card subheading text</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Main content area</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    const card = screen.getByTestId("test-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass("rounded-[14px]", "border-slate-200", "bg-white");

    const title = screen.getByRole("heading", { level: 3, name: /card heading/i });
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass("text-slate-950");

    expect(screen.getByText("Card subheading text")).toBeInTheDocument();
    expect(screen.getByText("Main content area")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /action/i })).toBeInTheDocument();
  });
});
