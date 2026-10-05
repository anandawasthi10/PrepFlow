import { describe, it, expect, vi, beforeEach } from "vitest";
import { signupUserAction } from "@/lib/auth/actions";
import * as serverSupabase from "@/lib/supabase/server";

describe("signupUserAction Server Action (PF-007)", () => {
  const mockSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverSupabase, "createClient").mockResolvedValue({
      auth: {
        signUp: mockSignUp,
      },
    } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);
  });

  it("handles valid signup with unconfirmed email (session === null)", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "mock-user-id", email: "new@example.com" },
        session: null, // Email confirmation required
      },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "new@example.com");
    formData.append("password", "Password123");
    formData.append("confirmPassword", "Password123");
    formData.append("fullName", "Anand Awasthi");
    formData.append("timezone", "Asia/Kolkata");

    const result = await signupUserAction(formData);

    expect(result.success).toBe(true);
    expect(result.requiresVerification).toBe(true);
    expect(result.message).toContain("Please check your email");

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "Password123",
      options: {
        data: {
          full_name: "Anand Awasthi",
          timezone: "Asia/Kolkata",
        },
      },
    });
  });

  it("handles valid signup with auto-confirmed email (session !== null)", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "mock-user-id", email: "autoconfirmed@example.com" },
        session: { access_token: "mock-token" }, // Active session
      },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "autoconfirmed@example.com");
    formData.append("password", "Password123");
    formData.append("confirmPassword", "Password123");

    const result = await signupUserAction(formData);

    expect(result.success).toBe(true);
    expect(result.requiresVerification).toBe(false);
    expect(result.message).toContain("Registration successful");
  });

  it("normalizes missing timezone to 'UTC' and empty fullName to null", async () => {
    mockSignUp.mockResolvedValue({
      data: {
        user: { id: "mock-user-id" },
        session: null,
      },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "test@example.com");
    formData.append("password", "Password123");
    formData.append("confirmPassword", "Password123");
    formData.append("fullName", "   "); // Empty whitespace
    formData.append("timezone", "Invalid/Timezone");

    const result = await signupUserAction(formData);

    expect(result.success).toBe(true);
    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "Password123",
      options: {
        data: {
          full_name: null,
          timezone: "UTC",
        },
      },
    });
  });

  it("returns validation field errors without calling Supabase on schema violations", async () => {
    const formData = new FormData();
    formData.append("email", "invalid-email");
    formData.append("password", "short");
    formData.append("confirmPassword", "different");

    const result = await signupUserAction(formData);

    expect(result.success).toBe(false);
    expect(result.errors?.email).toBeDefined();
    expect(result.errors?.password).toBeDefined();
    expect(result.errors?.confirmPassword).toBeDefined();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("returns generic non-enumeration error on Supabase auth failures", async () => {
    mockSignUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "User already registered", status: 400 },
    });

    const formData = new FormData();
    formData.append("email", "existing@example.com");
    formData.append("password", "Password123");
    formData.append("confirmPassword", "Password123");

    const result = await signupUserAction(formData);

    expect(result.success).toBe(false);
    expect(result.errors?._form).toContain(
      "Unable to complete registration. Please check your information and try again."
    );
  });
});
