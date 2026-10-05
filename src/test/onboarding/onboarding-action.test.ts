import { describe, it, expect, vi, beforeEach } from "vitest";
import { completeOnboardingAction } from "@/lib/onboarding/actions";
import * as serverSupabase from "@/lib/supabase/server";

describe("completeOnboardingAction Server Action (PF-009)", () => {
  const mockGetUser = vi.fn();
  const mockRpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverSupabase, "createClient").mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
      rpc: mockRpc,
    } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);
  });

  it("successfully completes onboarding with valid inputs", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "user@example.com" } },
      error: null,
    });

    mockRpc.mockResolvedValue({
      data: "mock-new-exam-id",
      error: null,
    });

    const formData = new FormData();
    formData.append("examName", "USMLE Step 1");
    formData.append("examDate", "2099-12-31");
    formData.append("dailyGoal", "25");
    formData.append("timezone", "Asia/Kolkata");

    const result = await completeOnboardingAction(formData);

    expect(result.success).toBe(true);
    expect(result.redirectTo).toBe("/dashboard");
    expect(result.examId).toBe("mock-new-exam-id");

    expect(mockRpc).toHaveBeenCalledWith("complete_onboarding", {
      p_exam_name: "USMLE Step 1",
      p_exam_date: "2099-12-31",
      p_daily_goal: 25,
      p_timezone: "Asia/Kolkata",
    });
  });

  it("normalizes missing timezone to UTC and defaults daily goal to 20", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockRpc.mockResolvedValue({
      data: "exam-456",
      error: null,
    });

    const formData = new FormData();
    formData.append("examName", "Bar Exam");
    formData.append("timezone", "Invalid/Timezone");

    const result = await completeOnboardingAction(formData);

    expect(result.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("complete_onboarding", {
      p_exam_name: "Bar Exam",
      p_exam_date: null,
      p_daily_goal: 20,
      p_timezone: "UTC",
    });
  });

  it("rejects unauthenticated requests", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "No session" },
    });

    const formData = new FormData();
    formData.append("examName", "MCAT");

    const result = await completeOnboardingAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("You must be signed in to complete onboarding.");
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("returns generic persistence error if RPC fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });

    mockRpc.mockResolvedValue({
      data: null,
      error: { message: "Internal Postgres error", code: "P0001" },
    });

    const formData = new FormData();
    formData.append("examName", "MCAT");

    const result = await completeOnboardingAction(formData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unable to save your onboarding setup. Please try again.");
  });

  it("returns validation errors on invalid inputs", async () => {
    const formData = new FormData();
    formData.append("examName", ""); // missing
    formData.append("dailyGoal", "-5"); // invalid

    const result = await completeOnboardingAction(formData);

    expect(result.success).toBe(false);
    expect(result.errors?.examName).toBeDefined();
    expect(result.errors?.dailyGoal).toBeDefined();
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
