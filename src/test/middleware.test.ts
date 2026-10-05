import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import * as ssr from "@supabase/ssr";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

describe("Next.js Middleware Session & Authorization (PF-008)", () => {
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-key";

    vi.mocked(ssr.createServerClient).mockImplementation((_url, _key, options) => {
      // Test calling cookies methods
      options.cookies.getAll();
      options.cookies.setAll([
        { name: "sb-auth-token", value: "token123", options: { path: "/" } },
      ]);

      return {
        auth: {
          getUser: mockGetUser,
        },
      } as unknown as ReturnType<typeof ssr.createServerClient>;
    });
  });

  it("redirects unauthenticated user from protected route to /login with redirectTo", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "No session" },
    });

    const request = new NextRequest("http://localhost:3000/practice?session=123");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirectTo=%2Fpractice%3Fsession%3D123"
    );
  });

  it("redirects authenticated user from /login to /dashboard", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/login");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("redirects authenticated user from /signup to /dashboard", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/signup");
    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("allows unauthenticated user to access /login without redirect", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "No session" },
    });

    const request = new NextRequest("http://localhost:3000/login");
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });

  it("allows authenticated user to access protected route /dashboard", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/dashboard");
    const response = await middleware(request);

    expect(response.status).toBe(200);
  });
});
