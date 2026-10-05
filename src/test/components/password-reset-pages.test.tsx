import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";
import ResetPasswordPage from "@/app/(auth)/reset-password/page";
import * as authActions from "@/lib/auth/actions";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("Password Reset Pages Accessibility & Interactions (PF-008)", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
  });

  describe("ForgotPasswordPage", () => {
    it("renders form inputs and handles reset link request", async () => {
      const user = userEvent.setup();
      vi.spyOn(authActions, "forgotPasswordAction").mockResolvedValue({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      });

      render(<ForgotPasswordPage />);

      expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

      await user.type(screen.getByLabelText(/email address/i), "user@example.com");
      await user.click(screen.getByRole("button", { name: /send reset link/i }));

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /check your email/i })).toBeInTheDocument();
        expect(screen.getByText(/if an account exists with this email/i)).toBeInTheDocument();
      });
    });
  });

  describe("ResetPasswordPage", () => {
    it("renders new password inputs and updates password successfully", async () => {
      const user = userEvent.setup();
      vi.spyOn(authActions, "resetPasswordAction").mockResolvedValue({
        success: true,
        redirectTo: "/login?message=password_updated",
      });

      render(<ResetPasswordPage />);

      expect(screen.getByRole("heading", { name: /set new password/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();

      await user.type(screen.getByLabelText(/^new password/i), "NewPassword123");
      await user.type(screen.getByLabelText(/confirm new password/i), "NewPassword123");
      await user.click(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login?message=password_updated");
      });
    });

    it("displays error alert when reset session is invalid or expired", async () => {
      const user = userEvent.setup();
      vi.spyOn(authActions, "resetPasswordAction").mockResolvedValue({
        success: false,
        error: "Your reset link is invalid or has expired. Please request a new one.",
      });

      render(<ResetPasswordPage />);

      await user.type(screen.getByLabelText(/^new password/i), "NewPassword123");
      await user.type(screen.getByLabelText(/confirm new password/i), "NewPassword123");
      await user.click(screen.getByRole("button", { name: /update password/i }));

      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent(/invalid or has expired/i);
      });
    });
  });
});
