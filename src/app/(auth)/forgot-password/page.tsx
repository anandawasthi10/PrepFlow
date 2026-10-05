"use client";

import * as React from "react";
import Link from "next/link";
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
import { forgotPasswordAction } from "@/lib/auth/actions";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("email", email);

    try {
      const result = await forgotPasswordAction(formData);

      if (result.success) {
        setIsSubmitted(true);
        setMessage(
          result.message ||
            "If an account exists with this email, a password reset link has been sent."
        );
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

  if (isSubmitted) {
    return (
      <PageContainer size="narrow">
        <div className="flex flex-col items-center justify-center min-h-[75vh] py-8">
          <Card className="w-full max-w-md text-center p-6 md:p-8">
            <Stack spacing={6} align="center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-950">Check your email</h1>
                <p className="text-sm text-slate-600">
                  {message ||
                    "If an account exists with this email, a password reset link has been sent."}
                </p>
              </div>
              <Link href="/login" className="w-full">
                <Button variant="secondary" className="w-full">
                  Return to Login
                </Button>
              </Link>
            </Stack>
          </Card>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="narrow">
      <div className="flex flex-col items-center justify-center min-h-[75vh] py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Mail className="h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Reset password</CardTitle>
            <CardDescription>
              Enter your email address and we will send you a link to reset your password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Stack spacing={4}>
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

                  <Button
                    type="submit"
                    variant="default"
                    className="w-full mt-2"
                    isLoading={isLoading}
                  >
                    Send Reset Link
                  </Button>
                </Stack>
              </form>
            </Stack>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 bg-slate-50/50 py-4">
            <p className="text-sm text-slate-600">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}
