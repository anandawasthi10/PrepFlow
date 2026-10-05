"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  normalizeTimezone,
  normalizeFullName,
  getSafeRedirectUrl,
} from "@/lib/validations/auth";

export interface SignupActionResult {
  success: boolean;
  requiresVerification?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface AuthActionResult {
  success: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  redirectTo?: string;
}

/**
 * Server Action for user signup.
 */
export async function signupUserAction(formData: FormData): Promise<SignupActionResult> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawConfirmPassword = formData.get("confirmPassword");
  const rawFullName = formData.get("fullName");
  const rawTimezone = formData.get("timezone");

  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const confirmPassword = typeof rawConfirmPassword === "string" ? rawConfirmPassword : "";
  const fullName = typeof rawFullName === "string" ? rawFullName.trim() : undefined;
  const timezone = typeof rawTimezone === "string" ? rawTimezone.trim() : undefined;

  const validationResult = signupSchema.safeParse({
    email,
    password,
    confirmPassword,
    fullName,
    timezone,
  });

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    return {
      success: false,
      errors: fieldErrors,
    };
  }

  const normalizedTz = normalizeTimezone(validationResult.data.timezone);
  const normalizedName = normalizeFullName(validationResult.data.fullName);

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: validationResult.data.email,
      password: validationResult.data.password,
      options: {
        data: {
          full_name: normalizedName,
          timezone: normalizedTz,
        },
      },
    });

    if (error) {
      return {
        success: false,
        errors: {
          _form: ["Unable to complete registration. Please check your information and try again."],
        },
      };
    }

    if (data.user) {
      const requiresVerification = data.session === null;

      return {
        success: true,
        requiresVerification,
        message: requiresVerification
          ? "Please check your email to verify your account."
          : "Registration successful.",
      };
    }

    return {
      success: false,
      errors: {
        _form: ["An unexpected error occurred during registration. Please try again."],
      },
    };
  } catch {
    return {
      success: false,
      errors: {
        _form: ["Unable to connect to authentication service. Please try again later."],
      },
    };
  }
}

/**
 * Server Action for user login.
 * Returns non-enumerating error message on credential mismatch.
 */
export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");
  const rawRedirectTo = formData.get("redirectTo");

  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";
  const redirectTo = typeof rawRedirectTo === "string" ? rawRedirectTo : undefined;

  const validationResult = loginSchema.safeParse({
    email,
    password,
    redirectTo,
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

    const { error } = await supabase.auth.signInWithPassword({
      email: validationResult.data.email,
      password: validationResult.data.password,
    });

    if (error) {
      return {
        success: false,
        error: "Invalid email or password. Please check your credentials and try again.",
      };
    }

    const safeRedirect = getSafeRedirectUrl(validationResult.data.redirectTo, "/dashboard");

    return {
      success: true,
      redirectTo: safeRedirect,
    };
  } catch {
    return {
      success: false,
      error: "Unable to connect to authentication service. Please try again later.",
    };
  }
}

/**
 * Server Action for password reset request.
 * Returns a generic non-enumerating confirmation regardless of account existence.
 */
export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.trim() : "";

  const validationResult = forgotPasswordSchema.safeParse({ email });

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    return {
      success: false,
      errors: fieldErrors,
    };
  }

  try {
    const supabase = await createClient();
    const headerList = await headers();
    const origin =
      headerList.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await supabase.auth.resetPasswordForEmail(validationResult.data.email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });

    return {
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    };
  } catch {
    return {
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    };
  }
}

/**
 * Server Action for password reset completion.
 * Requires an active recovery session. Signs out session upon completion.
 */
export async function resetPasswordAction(formData: FormData): Promise<AuthActionResult> {
  const rawPassword = formData.get("password");
  const rawConfirmPassword = formData.get("confirmPassword");

  const password = typeof rawPassword === "string" ? rawPassword : "";
  const confirmPassword = typeof rawConfirmPassword === "string" ? rawConfirmPassword : "";

  const validationResult = resetPasswordSchema.safeParse({
    password,
    confirmPassword,
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

    // Verify active recovery session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Your reset link is invalid or has expired. Please request a new one.",
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: validationResult.data.password,
    });

    if (updateError) {
      return {
        success: false,
        error: "Unable to update password. Please try again.",
      };
    }

    // Sign out the recovery session so the user logs in fresh with new password
    await supabase.auth.signOut();

    return {
      success: true,
      redirectTo: "/login?message=password_updated",
    };
  } catch {
    return {
      success: false,
      error: "Unable to connect to authentication service. Please try again later.",
    };
  }
}

/**
 * Server Action for user logout.
 * Terminates Supabase session and redirects to /login.
 */
export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
