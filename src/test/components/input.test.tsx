import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/input";

describe("Input component", () => {
  it("associates label with input using htmlFor and id", () => {
    render(<Input label="Email address" id="email-field" />);
    const label = screen.getByText("Email address");
    const input = screen.getByLabelText("Email address");

    expect(label).toHaveAttribute("for", "email-field");
    expect(input).toHaveAttribute("id", "email-field");
  });

  it("handles user typing via userEvent", async () => {
    const user = userEvent.setup();
    render(<Input label="Username" placeholder="Enter username" />);

    const input = screen.getByPlaceholderText("Enter username");
    await user.type(input, "testuser");
    expect(input).toHaveValue("testuser");
  });

  it("renders helper text and associates with aria-describedby", () => {
    render(<Input label="Password" helperText="Must be 8+ characters" id="pass-field" />);
    const input = screen.getByLabelText("Password");
    const helper = screen.getByText("Must be 8+ characters");

    expect(helper).toHaveAttribute("id", "pass-field-helper");
    expect(input).toHaveAttribute("aria-describedby", "pass-field-helper");
    expect(input).toHaveAttribute("aria-invalid", "false");
  });

  it("renders error message, sets aria-invalid=true and points aria-describedby to error", () => {
    render(
      <Input
        label="Exam Name"
        error="Exam name is required"
        helperText="Ignored when error exists"
        id="exam-field"
      />
    );
    const input = screen.getByLabelText("Exam Name");
    const errorText = screen.getByRole("alert");

    expect(errorText).toHaveTextContent("Exam name is required");
    expect(errorText).toHaveAttribute("id", "exam-field-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "exam-field-error");
  });
});
