import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupPage from "@/app/(auth)/signup/page";
import * as authActions from "@/lib/auth/actions";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("SignupPage Component Accessibility & Interactions (PF-007)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders accessible form inputs with labels and helper text", () => {
    render(<SignupPage />);

    expect(screen.getByRole("heading", { name: /create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

    const submitButton = screen.getByRole("button", { name: /create account/i });
    expect(submitButton).toBeInTheDocument();
  });

  it("submits form and transitions to verification view when verification is required", async () => {
    const user = userEvent.setup();
    vi.spyOn(authActions, "signupUserAction").mockResolvedValue({
      success: true,
      requiresVerification: true,
      message: "Please check your email to verify your account.",
    });

    render(<SignupPage />);

    await user.type(screen.getByLabelText(/full name/i), "Anand Awasthi");
    await user.type(screen.getByLabelText(/email address/i), "anand@example.com");
    await user.type(screen.getByLabelText(/^password/i), "Password123");
    await user.type(screen.getByLabelText(/confirm password/i), "Password123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /verify your email/i })).toBeInTheDocument();
      expect(screen.getByText(/we sent a confirmation link to/i)).toBeInTheDocument();
      expect(screen.getByText("anand@example.com")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /proceed to login/i })).toBeInTheDocument();
    });
  });

  it("redirects directly to /onboarding when email does not require verification", async () => {
    const user = userEvent.setup();
    vi.spyOn(authActions, "signupUserAction").mockResolvedValue({
      success: true,
      requiresVerification: false,
    });

    render(<SignupPage />);

    await user.type(screen.getByLabelText(/email address/i), "auto@example.com");
    await user.type(screen.getByLabelText(/^password/i), "Password123");
    await user.type(screen.getByLabelText(/confirm password/i), "Password123");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("renders inline field errors returned from server action", async () => {
    const user = userEvent.setup();
    vi.spyOn(authActions, "signupUserAction").mockResolvedValue({
      success: false,
      errors: {
        email: ["Please enter a valid email address"],
        password: ["Password must be at least 8 characters long"],
      },
    });

    render(<SignupPage />);

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();
      expect(screen.getByText("Password must be at least 8 characters long")).toBeInTheDocument();
    });
  });
});
