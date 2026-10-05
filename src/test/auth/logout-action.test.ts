import { describe, it, expect, vi, beforeEach } from "vitest";
import { logoutAction } from "@/lib/auth/actions";
import * as serverSupabase from "@/lib/supabase/server";
import { redirect } from "next/navigation";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT; replace; ${url}; 307;`);
    (error as unknown as { digest: string }).digest = `NEXT_REDIRECT; replace; ${url}; 307;`;
    throw error;
  }),
}));

describe("logoutAction Server Action (PF-008)", () => {
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverSupabase, "createClient").mockResolvedValue({
      auth: {
        signOut: mockSignOut,
      },
    } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);
  });

  it("calls signOut and throws Next.js redirect to /login without swallowing", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockSignOut).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
