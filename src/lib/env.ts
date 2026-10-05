import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
});

const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1, "SUPABASE_SECRET_KEY is required"),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Lazy validator for public environment variables.
 * Validates only when explicitly invoked by client factories.
 * Missing-variable errors report only variable names, never values.
 */
export function getPublicEnv(): PublicEnv {
  const result = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!result.success) {
    const missingKeys = result.error.errors.map((e) => e.path.join(".")).join(", ");
    throw new Error(`Missing or invalid public environment configuration: ${missingKeys}`);
  }

  return result.data;
}

/**
 * Lazy validator for server-only environment variables.
 */
export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });

  if (!result.success) {
    const missingKeys = result.error.errors.map((e) => e.path.join(".")).join(", ");
    throw new Error(`Missing or invalid server environment configuration: ${missingKeys}`);
  }

  return result.data;
}
