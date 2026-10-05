import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";
import * as authActions from "@/lib/auth/actions";
import { useRouter, useSearchParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe("LoginPage Component Accessibility & Interactions (PF-008)", () => {
  const mockPush = vi.fn();
  const mockGet = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue({
      get: mockGet,
    } as unknown as ReturnType<typeof useSearchParams>);
    mockGet.mockReturnValue(null);
  });

  it("renders accessible form inputs with labels and links", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /forgot password\?/i })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/signup");
  });

  it("submits valid credentials and routes to dashboard", async () => {
    const user = userEvent.setup();
    vi.spyOn(authActions, "loginAction").mockResolvedValue({
      success: true,
      redirectTo: "/dashboard",
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email address/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "ValidPassword123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("displays non-enumerating error alert on invalid credentials", async () => {
    const user = userEvent.setup();
    vi.spyOn(authActions, "loginAction").mockResolvedValue({
      success: false,
      error: "Invalid email or password. Please check your credentials and try again.",
    });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email address/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/password/i), "WrongPassword123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/invalid email or password/i);
    });
  });

  it("displays password updated notification when message=password_updated", () => {
    mockGet.mockImplementation((param: string) =>
      param === "message" ? "password_updated" : null
    );

    render(<LoginPage />);

    expect(screen.getByRole("status")).toHaveTextContent(/password updated/i);
  });

  it("displays callback failure alert when error=auth_callback_failed", () => {
    mockGet.mockImplementation((param: string) =>
      param === "error" ? "auth_callback_failed" : null
    );

    render(<LoginPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /verification link is invalid or has expired/i
    );
  });
});
