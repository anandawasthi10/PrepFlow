import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginAction } from "@/lib/auth/actions";
import * as serverSupabase from "@/lib/supabase/server";

describe("loginAction Server Action (PF-008)", () => {
  const mockSignInWithPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverSupabase, "createClient").mockResolvedValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);
  });

  it("handles valid login and returns safe fallback redirect", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: "mock-user-id", email: "user@example.com" },
        session: { access_token: "mock-token" },
      },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "user@example.com");
    formData.append("password", "ValidPassword123");

    const result = await loginAction(formData);

    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe("/dashboard");
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "ValidPassword123",
    });
  });

  it("handles custom approved internal redirectTo parameter", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: "mock-user-id" },
        session: { access_token: "mock-token" },
      },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "user@example.com");
    formData.append("password", "ValidPassword123");
    formData.append("redirectTo", "/practice");

    const result = await loginAction(formData);

    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe("/practice");
  });

  it("normalizes malicious external redirectTo back to /dashboard", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: "mock-user-id" },
        session: { access_token: "mock-token" },
      },
      error: null,
    });

    const formData = new FormData();
    formData.append("email", "user@example.com");
    formData.append("password", "ValidPassword123");
    formData.append("redirectTo", "https://attacker.com/steal");

    const result = await loginAction(formData);

    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe("/dashboard");
  });

  it("returns generic non-enumerating error on invalid credentials", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials", status: 400 },
    });

    const formData = new FormData();
    formData.append("email", "unknown@example.com");
    formData.append("password", "WrongPassword123");

    const result = await loginAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe(
      "Invalid email or password. Please check your credentials and try again."
    );
  });

  it("returns validation field errors on missing fields", async () => {
    const formData = new FormData();
    formData.append("email", "");
    formData.append("password", "");

    const result = await loginAction(formData);

    expect(result.success).toBe(false);
    expect(result.errors?.email).toBeDefined();
    expect(result.errors?.password).toBeDefined();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });
});
