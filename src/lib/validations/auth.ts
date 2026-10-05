import { z } from "zod";

/**
 * Validates whether a string is a valid IANA timezone identifier.
 */
export function isValidTimezone(tz: string): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalizes input timezone: if missing, empty, or invalid, returns "UTC".
 */
export function normalizeTimezone(tz?: string | null): string {
  if (!tz || typeof tz !== "string" || !tz.trim()) {
    return "UTC";
  }
  const trimmed = tz.trim();
  return isValidTimezone(trimmed) ? trimmed : "UTC";
}

/**
 * Normalizes full name: trims whitespace; empty strings normalize to null.
 */
export function normalizeFullName(name?: string | null): string | null {
  if (!name || typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Approved internal redirect prefixes and destinations.
 */
const APPROVED_REDIRECT_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/reset-password",
  "/practice",
  "/books",
  "/analytics",
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
];

/**
 * Validates that a redirect target is a safe internal relative path.
 * Rejects protocol-relative URLs (//), backslashes (/\\), scheme prefixes, and external destinations.
 * Falls back to the provided fallback or "/dashboard".
 */
export function getSafeRedirectUrl(
  target: string | null | undefined,
  fallback: string = "/dashboard"
): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();

  // Must start with single slash and NOT double slash or backslash
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Must not contain schemes or control characters
  if (trimmed.includes(":") || /[\x00-\x1F\x7F]/.test(trimmed) || /\s/.test(trimmed)) {
    return fallback;
  }

  // Check against approved internal prefixes
  const isApproved = APPROVED_REDIRECT_PREFIXES.some(
    (prefix) =>
      trimmed === prefix || trimmed.startsWith(`${prefix}/`) || trimmed.startsWith(`${prefix}?`)
  );

  return isApproved ? trimmed : fallback;
}

export const signupSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .max(255, "Email must not exceed 255 characters")
      .toLowerCase(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password must not exceed 100 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    fullName: z
      .string()
      .trim()
      .max(100, "Full name must not exceed 100 characters")
      .optional()
      .nullable(),
    timezone: z.string().optional().nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters")
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required")
    .max(100, "Password must not exceed 100 characters"),
  redirectTo: z.string().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must not exceed 255 characters")
    .toLowerCase(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password must not exceed 100 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
