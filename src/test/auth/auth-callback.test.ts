import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/auth/callback/route";
import * as serverSupabase from "@/lib/supabase/server";

describe("Auth Callback Route Handler (PF-007 / PF-008)", () => {
  const mockExchangeCode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverSupabase, "createClient").mockResolvedValue({
      auth: {
        exchangeCodeForSession: mockExchangeCode,
      },
    } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);
  });

  it("exchanges valid code and redirects to default fallback /onboarding", async () => {
    mockExchangeCode.mockResolvedValue({
      data: { session: { access_token: "mock-token" } },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/auth/callback?code=valid-auth-code");
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/onboarding");
    expect(mockExchangeCode).toHaveBeenCalledWith("valid-auth-code");
  });

  it("redirects to /reset-password when next=/reset-password", async () => {
    mockExchangeCode.mockResolvedValue({
      data: { session: { access_token: "mock-recovery-token" } },
      error: null,
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=valid-recovery-code&next=/reset-password"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/reset-password");
  });

  it("redirects to /reset-password when type=recovery", async () => {
    mockExchangeCode.mockResolvedValue({
      data: { session: { access_token: "mock-recovery-token" } },
      error: null,
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=valid-recovery-code&type=recovery"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/reset-password");
  });

  it("normalizes malicious external next parameter back to /onboarding", async () => {
    mockExchangeCode.mockResolvedValue({
      data: { session: { access_token: "mock-token" } },
      error: null,
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=valid-code&next=https://attacker.com"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/onboarding");
  });

  it("redirects to /login?error=auth_callback_failed when code parameter is missing", async () => {
    const request = new NextRequest("http://localhost:3000/auth/callback");
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth_callback_failed"
    );
    expect(mockExchangeCode).not.toHaveBeenCalled();
  });

  it("redirects to /login?error=auth_callback_failed when code exchange fails", async () => {
    mockExchangeCode.mockResolvedValue({
      data: null,
      error: { message: "Invalid or expired token" },
    });

    const request = new NextRequest("http://localhost:3000/auth/callback?code=expired-code");
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=auth_callback_failed"
    );
  });
});
