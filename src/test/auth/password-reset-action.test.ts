import { describe, it, expect, vi, beforeEach } from "vitest";
import { forgotPasswordAction, resetPasswordAction } from "@/lib/auth/actions";
import * as serverSupabase from "@/lib/supabase/server";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("http://localhost:3000"),
  }),
}));

describe("Password Reset Actions (PF-008)", () => {
  const mockResetPasswordForEmail = vi.fn();
  const mockGetUser = vi.fn();
  const mockUpdateUser = vi.fn();
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverSupabase, "createClient").mockResolvedValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
        getUser: mockGetUser,
        updateUser: mockUpdateUser,
        signOut: mockSignOut,
      },
    } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);
  });

  describe("forgotPasswordAction", () => {
    it("returns non-enumerating confirmation on valid email", async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const formData = new FormData();
      formData.append("email", "student@example.com");

      const result = await forgotPasswordAction(formData);

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "If an account exists with this email, a password reset link has been sent."
      );
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith("student@example.com", {
        redirectTo: "http://localhost:3000/auth/callback?next=/reset-password",
      });
    });

    it("returns the exact same non-enumerating message even if Supabase returns an error", async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: "User not found", status: 400 },
      });

      const formData = new FormData();
      formData.append("email", "nonexistent@example.com");

      const result = await forgotPasswordAction(formData);

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "If an account exists with this email, a password reset link has been sent."
      );
    });
  });

  describe("resetPasswordAction", () => {
    it("updates password, signs out recovery session, and redirects to login", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "mock-recovery-user-id" } },
        error: null,
      });
      mockUpdateUser.mockResolvedValue({
        data: { user: { id: "mock-recovery-user-id" } },
        error: null,
      });
      mockSignOut.mockResolvedValue({ error: null });

      const formData = new FormData();
      formData.append("password", "NewStrongPassword123");
      formData.append("confirmPassword", "NewStrongPassword123");

      const result = await resetPasswordAction(formData);

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/login?message=password_updated");
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "NewStrongPassword123" });
      expect(mockSignOut).toHaveBeenCalled();
    });

    it("returns safe error when recovery session is missing or expired", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Auth session missing", status: 401 },
      });

      const formData = new FormData();
      formData.append("password", "NewStrongPassword123");
      formData.append("confirmPassword", "NewStrongPassword123");

      const result = await resetPasswordAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Your reset link is invalid or has expired. Please request a new one."
      );
      expect(mockUpdateUser).not.toHaveBeenCalled();
      expect(mockSignOut).not.toHaveBeenCalled();
    });

    it("returns validation errors on mismatched passwords", async () => {
      const formData = new FormData();
      formData.append("password", "NewStrongPassword123");
      formData.append("confirmPassword", "DifferentPassword123");

      const result = await resetPasswordAction(formData);

      expect(result.success).toBe(false);
      expect(result.errors?.confirmPassword).toBeDefined();
      expect(mockGetUser).not.toHaveBeenCalled();
    });
  });
});
