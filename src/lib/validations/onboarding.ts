import { z } from "zod";
import { normalizeTimezone } from "@/lib/validations/auth";

/**
 * Validates whether a date string YYYY-MM-DD is today or in the future in the given timezone.
 */
export function isFutureOrTodayDate(dateStr: string, timezone: string = "UTC"): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  try {
    const validTz = normalizeTimezone(timezone);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: validTz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const todayInTz = formatter.format(new Date()); // Formats as YYYY-MM-DD
    return dateStr >= todayInTz;
  } catch {
    return false;
  }
}

export const onboardingSchema = z
  .object({
    examName: z
      .string()
      .trim()
      .min(1, "Exam name is required")
      .max(100, "Exam name must not exceed 100 characters"),
    examDate: z
      .string()
      .trim()
      .optional()
      .nullable()
      .refine(
        (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
        "Exam date must be a valid calendar date in YYYY-MM-DD format"
      ),
    dailyGoal: z
      .number({ invalid_type_error: "Daily question goal must be a number" })
      .int("Daily question goal must be a whole number")
      .min(1, "Daily question goal must be at least 1")
      .max(500, "Daily question goal cannot exceed 500 questions"),
    timezone: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.examDate && data.examDate.trim().length > 0) {
      const tz = normalizeTimezone(data.timezone);
      if (!isFutureOrTodayDate(data.examDate, tz)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Exam date cannot be in the past",
          path: ["examDate"],
        });
      }
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;
