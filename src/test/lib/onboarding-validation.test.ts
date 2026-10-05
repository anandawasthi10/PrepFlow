import { describe, it, expect } from "vitest";
import { onboardingSchema, isFutureOrTodayDate } from "@/lib/validations/onboarding";

describe("Onboarding Validation Schema (PF-009)", () => {
  it("accepts valid onboarding input with future exam date", () => {
    const result = onboardingSchema.safeParse({
      examName: "USMLE Step 1",
      examDate: "2099-12-31",
      dailyGoal: 30,
      timezone: "America/New_York",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.examName).toBe("USMLE Step 1");
      expect(result.data.dailyGoal).toBe(30);
      expect(result.data.examDate).toBe("2099-12-31");
    }
  });

  it("accepts valid onboarding input without exam date (open-ended)", () => {
    const result = onboardingSchema.safeParse({
      examName: "Bar Exam",
      examDate: null,
      dailyGoal: 20,
      timezone: "UTC",
    });

    expect(result.success).toBe(true);
  });

  it("accepts today's calendar date in the given timezone", () => {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const todayInKolkata = formatter.format(new Date());

    const result = onboardingSchema.safeParse({
      examName: "NCLEX-RN",
      examDate: todayInKolkata,
      dailyGoal: 25,
      timezone: "Asia/Kolkata",
    });

    expect(result.success).toBe(true);
  });

  it("rejects past exam dates", () => {
    const result = onboardingSchema.safeParse({
      examName: "CFA Level 1",
      examDate: "2000-01-01",
      dailyGoal: 20,
      timezone: "UTC",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.examDate).toContain(
        "Exam date cannot be in the past"
      );
    }
  });

  it("rejects empty or whitespace-only exam names", () => {
    const result = onboardingSchema.safeParse({
      examName: "   ",
      dailyGoal: 20,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.examName).toBeDefined();
    }
  });

  it("rejects exam names exceeding 100 characters", () => {
    const longName = "E".repeat(101);
    const result = onboardingSchema.safeParse({
      examName: longName,
      dailyGoal: 20,
    });

    expect(result.success).toBe(false);
  });

  it("rejects daily goals less than 1 or exceeding 500", () => {
    const zeroGoal = onboardingSchema.safeParse({
      examName: "Exam",
      dailyGoal: 0,
    });
    expect(zeroGoal.success).toBe(false);

    const negativeGoal = onboardingSchema.safeParse({
      examName: "Exam",
      dailyGoal: -5,
    });
    expect(negativeGoal.success).toBe(false);

    const excessiveGoal = onboardingSchema.safeParse({
      examName: "Exam",
      dailyGoal: 501,
    });
    expect(excessiveGoal.success).toBe(false);
  });

  it("normalizes invalid timezones to UTC when checking dates", () => {
    expect(isFutureOrTodayDate("2099-01-01", "Invalid/Timezone")).toBe(true);
    expect(isFutureOrTodayDate("1990-01-01", "Invalid/Timezone")).toBe(false);
  });
});
