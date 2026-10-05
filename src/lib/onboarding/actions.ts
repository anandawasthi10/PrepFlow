"use server";

import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validations/onboarding";
import { normalizeTimezone } from "@/lib/validations/auth";

export interface OnboardingActionResult {
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
  redirectTo?: string;
  examId?: string;
}

/**
 * Server Action to complete onboarding.
 * Atomically configures the active exam profile, daily question target, and profile completion.
 */
export async function completeOnboardingAction(
  formData: FormData
): Promise<OnboardingActionResult> {
  const rawExamName = formData.get("examName");
  const rawExamDate = formData.get("examDate");
  const rawDailyGoal = formData.get("dailyGoal");
  const rawTimezone = formData.get("timezone");

  const examName = typeof rawExamName === "string" ? rawExamName.trim() : "";
  const examDate =
    typeof rawExamDate === "string" && rawExamDate.trim().length > 0 ? rawExamDate.trim() : null;

  let dailyGoal = 20;
  if (typeof rawDailyGoal === "string" && rawDailyGoal.trim().length > 0) {
    const parsed = Number.parseInt(rawDailyGoal.trim(), 10);
    if (!Number.isNaN(parsed)) {
      dailyGoal = parsed;
    }
  }

  const rawTz = typeof rawTimezone === "string" ? rawTimezone.trim() : undefined;
  const timezone = normalizeTimezone(rawTz);

  const validationResult = onboardingSchema.safeParse({
    examName,
    examDate,
    dailyGoal,
    timezone,
  });

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    return {
      success: false,
      errors: fieldErrors,
    };
  }

  try {
    const supabase = await createClient();

    // Verify authenticated session (user ownership derived strictly from session)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be signed in to complete onboarding.",
      };
    }

    // Call atomic RPC function in single transaction
    const { data: examId, error: rpcError } = await supabase.rpc("complete_onboarding", {
      p_exam_name: validationResult.data.examName,
      p_exam_date: validationResult.data.examDate || null,
      p_daily_goal: validationResult.data.dailyGoal,
      p_timezone: timezone,
    });

    if (rpcError) {
      return {
        success: false,
        error: "Unable to save your onboarding setup. Please try again.",
      };
    }

    return {
      success: true,
      redirectTo: "/dashboard",
      examId: typeof examId === "string" ? examId : undefined,
    };
  } catch {
    return {
      success: false,
      error: "Unable to complete onboarding. Please try again later.",
    };
  }
}
