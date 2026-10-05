import { describe, it, expect } from "vitest";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  normalizeTimezone,
  normalizeFullName,
  isValidTimezone,
  getSafeRedirectUrl,
} from "@/lib/validations/auth";

describe("Auth Validation & Normalization Utilities (PF-007 / PF-008)", () => {
  describe("signupSchema", () => {
    it("accepts valid registration input", () => {
      const result = signupSchema.safeParse({
        email: "student@example.com",
        password: "StrongPassword1",
        confirmPassword: "StrongPassword1",
        fullName: "Anand Awasthi",
        timezone: "Asia/Kolkata",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("student@example.com");
        expect(result.data.fullName).toBe("Anand Awasthi");
      }
    });

    it("lowercases and trims email", () => {
      const result = signupSchema.safeParse({
        email: "  STUDENT@EXAMPLE.COM  ",
        password: "StrongPassword1",
        confirmPassword: "StrongPassword1",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("student@example.com");
      }
    });

    it("rejects mismatched passwords", () => {
      const result = signupSchema.safeParse({
        email: "user@example.com",
        password: "Password123",
        confirmPassword: "DifferentPassword123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
          "Passwords do not match"
        );
      }
    });

    it("rejects passwords under 8 characters", () => {
      const result = signupSchema.safeParse({
        email: "user@example.com",
        password: "Pass1",
        confirmPassword: "Pass1",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.password).toContain(
          "Password must be at least 8 characters long"
        );
      }
    });

    it("rejects passwords without numbers or letters", () => {
      const noNumber = signupSchema.safeParse({
        email: "user@example.com",
        password: "PasswordOnly",
        confirmPassword: "PasswordOnly",
      });
      expect(noNumber.success).toBe(false);

      const noLetter = signupSchema.safeParse({
        email: "user@example.com",
        password: "1234567890",
        confirmPassword: "1234567890",
      });
      expect(noLetter.success).toBe(false);
    });

    it("enforces max length bounds on email and full name", () => {
      const longEmail = `${"a".repeat(250)}@example.com`;
      const resultEmail = signupSchema.safeParse({
        email: longEmail,
        password: "Password123",
        confirmPassword: "Password123",
      });
      expect(resultEmail.success).toBe(false);

      const longName = "A".repeat(101);
      const resultName = signupSchema.safeParse({
        email: "valid@example.com",
        password: "Password123",
        confirmPassword: "Password123",
        fullName: longName,
      });
      expect(resultName.success).toBe(false);
    });
  });

  describe("loginSchema (PF-008)", () => {
    it("accepts valid login credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "MyPassword123",
        redirectTo: "/practice",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
        expect(result.data.password).toBe("MyPassword123");
        expect(result.data.redirectTo).toBe("/practice");
      }
    });

    it("rejects empty email and password", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.email).toBeDefined();
        expect(result.error.flatten().fieldErrors.password).toBeDefined();
      }
    });
  });

  describe("forgotPasswordSchema (PF-008)", () => {
    it("accepts valid email for password reset", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "student@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email format", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("resetPasswordSchema (PF-008)", () => {
    it("accepts matching new passwords meeting complexity rules", () => {
      const result = resetPasswordSchema.safeParse({
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects mismatched new passwords", () => {
      const result = resetPasswordSchema.safeParse({
        password: "NewPassword123",
        confirmPassword: "MismatchPassword123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("getSafeRedirectUrl (PF-008)", () => {
    it("permits approved internal relative paths", () => {
      expect(getSafeRedirectUrl("/dashboard")).toBe("/dashboard");
      expect(getSafeRedirectUrl("/onboarding")).toBe("/onboarding");
      expect(getSafeRedirectUrl("/reset-password")).toBe("/reset-password");
      expect(getSafeRedirectUrl("/practice")).toBe("/practice");
      expect(getSafeRedirectUrl("/practice?session=123")).toBe("/practice?session=123");
    });

    it("rejects protocol-relative URLs (//) and backslashes", () => {
      expect(getSafeRedirectUrl("//evil.com")).toBe("/dashboard");
      expect(getSafeRedirectUrl("/\\evil.com")).toBe("/dashboard");
      expect(getSafeRedirectUrl("//localhost:3000/onboarding")).toBe("/dashboard");
    });

    it("rejects external scheme URLs (http, https, javascript, data)", () => {
      expect(getSafeRedirectUrl("https://attacker.com")).toBe("/dashboard");
      expect(getSafeRedirectUrl("http://evil.com/login")).toBe("/dashboard");
      expect(getSafeRedirectUrl("javascript:alert(1)")).toBe("/dashboard");
      expect(getSafeRedirectUrl("data:text/html,evil")).toBe("/dashboard");
    });

    it("uses custom fallback when target is invalid", () => {
      expect(getSafeRedirectUrl("https://attacker.com", "/onboarding")).toBe("/onboarding");
      expect(getSafeRedirectUrl(null, "/login")).toBe("/login");
      expect(getSafeRedirectUrl("", "/onboarding")).toBe("/onboarding");
    });

    it("rejects paths with whitespace or control characters", () => {
      expect(getSafeRedirectUrl("/dashboard\n")).toBe("/dashboard");
      expect(getSafeRedirectUrl("/dashboard test")).toBe("/dashboard");
    });
  });

  describe("normalizeTimezone", () => {
    it("returns valid IANA timezones intact", () => {
      expect(normalizeTimezone("America/New_York")).toBe("America/New_York");
      expect(normalizeTimezone("Asia/Kolkata")).toBe("Asia/Kolkata");
      expect(normalizeTimezone("Europe/London")).toBe("Europe/London");
      expect(normalizeTimezone("UTC")).toBe("UTC");
    });

    it("falls back to UTC for invalid or empty timezone strings", () => {
      expect(normalizeTimezone("")).toBe("UTC");
      expect(normalizeTimezone("   ")).toBe("UTC");
      expect(normalizeTimezone(null)).toBe("UTC");
      expect(normalizeTimezone(undefined)).toBe("UTC");
      expect(normalizeTimezone("Invalid/Timezone_Name")).toBe("UTC");
      expect(normalizeTimezone("random string")).toBe("UTC");
    });
  });

  describe("normalizeFullName", () => {
    it("trims whitespace from valid names", () => {
      expect(normalizeFullName("  John Doe  ")).toBe("John Doe");
      expect(normalizeFullName("Alice")).toBe("Alice");
    });

    it("normalizes empty or whitespace-only names to null", () => {
      expect(normalizeFullName("")).toBe(null);
      expect(normalizeFullName("   ")).toBe(null);
      expect(normalizeFullName(null)).toBe(null);
      expect(normalizeFullName(undefined)).toBe(null);
    });
  });

  describe("isValidTimezone", () => {
    it("correctly identifies valid IANA timezones", () => {
      expect(isValidTimezone("UTC")).toBe(true);
      expect(isValidTimezone("America/Los_Angeles")).toBe(true);
      expect(isValidTimezone("Asia/Tokyo")).toBe(true);
    });

    it("rejects invalid timezone strings", () => {
      expect(isValidTimezone("Fake/Timezone")).toBe(false);
      expect(isValidTimezone("")).toBe(false);
    });
  });
});
