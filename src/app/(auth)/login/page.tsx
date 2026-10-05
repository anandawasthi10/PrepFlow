"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { loginAction } from "@/lib/auth/actions";
import { CheckCircle2, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "";
  const messageParam = searchParams.get("message");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const isPasswordUpdated = messageParam === "password_updated";
  const isCallbackError = errorParam === "auth_callback_failed";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    if (redirectTo) {
      formData.append("redirectTo", redirectTo);
    }

    try {
      const result = await loginAction(formData);

      if (result.success && result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        if (result.error) {
          setFormError(result.error);
        }
        if (result.errors) {
          setFieldErrors(result.errors);
        }
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer size="narrow">
      <div className="flex flex-col items-center justify-center min-h-[75vh] py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription>
              Log in to your PrepFlow account to continue your practice
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Stack spacing={4}>
              {isPasswordUpdated && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                >
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium">Password Updated</p>
                    <p className="text-emerald-700">
                      Your password has been updated. Please log in with your new password.
                    </p>
                  </div>
                </div>
              )}

              {isCallbackError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                >
                  <AlertCircle
                    className="h-5 w-5 shrink-0 text-red-600 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-medium">Verification Failed</p>
                    <p className="text-red-700">
                      The verification link is invalid or has expired. Please sign in or request a
                      new link.
                    </p>
                  </div>
                </div>
              )}

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                >
                  <AlertCircle
                    className="h-5 w-5 shrink-0 text-red-600 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={4}>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    error={fieldErrors.email?.[0]}
                  />

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-sm font-medium text-slate-900">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      error={fieldErrors.password?.[0]}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="default"
                    className="w-full mt-2"
                    isLoading={isLoading}
                  >
                    Sign In
                  </Button>
                </Stack>
              </form>
            </Stack>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 bg-slate-50/50 py-4">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <PageContainer size="narrow">
          <div className="flex items-center justify-center min-h-[75vh]">
            <p className="text-sm text-slate-500">Loading...</p>
          </div>
        </PageContainer>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
