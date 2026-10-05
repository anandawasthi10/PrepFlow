import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getPublicEnv, getServerEnv } from "@/lib/env";

describe("Environment Configuration (src/lib/env.ts)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getPublicEnv", () => {
    it("successfully parses valid public environment variables", () => {
      process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-test-project.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-publishable-key-12345";

      const publicEnv = getPublicEnv();

      expect(publicEnv.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
      expect(publicEnv.NEXT_PUBLIC_SUPABASE_URL).toBe("https://mock-test-project.supabase.co");
      expect(publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe("mock-publishable-key-12345");
    });

    it("throws a clear error listing missing variable names without exposing secrets", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      expect(() => getPublicEnv()).toThrowError(
        /Missing or invalid public environment configuration: NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/
      );
    });

    it("throws an error when URL is malformed", () => {
      process.env.NEXT_PUBLIC_APP_URL = "not-a-valid-url";
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock-test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "mock-key";

      expect(() => getPublicEnv()).toThrowError(
        /Missing or invalid public environment configuration: NEXT_PUBLIC_APP_URL/
      );
    });
  });

  describe("getServerEnv", () => {
    it("successfully parses valid server environment variables", () => {
      process.env.SUPABASE_SECRET_KEY = "mock-secret-key-abcdef";

      const serverEnv = getServerEnv();
      expect(serverEnv.SUPABASE_SECRET_KEY).toBe("mock-secret-key-abcdef");
    });

    it("throws a clear error naming SUPABASE_SECRET_KEY without exposing secrets", () => {
      delete process.env.SUPABASE_SECRET_KEY;

      expect(() => getServerEnv()).toThrowError(
        /Missing or invalid server environment configuration: SUPABASE_SECRET_KEY/
      );
    });
  });
});
