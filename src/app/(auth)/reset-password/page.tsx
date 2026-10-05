"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { resetPasswordAction } from "@/lib/auth/actions";
import { Lock, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);

    try {
      const result = await resetPasswordAction(formData);

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
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Set new password</CardTitle>
            <CardDescription>
              Enter a new secure password for your PrepFlow account.
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
                    id="password"
                    name="password"
                    type="password"
                    label="New Password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    helperText="At least 8 characters with a letter and a number"
                    disabled={isLoading}
                    error={fieldErrors.password?.[0]}
                  />

                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Confirm New Password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    error={fieldErrors.confirmPassword?.[0]}
                  />

                  <Button
                    type="submit"
                    variant="default"
                    className="w-full mt-2"
                    isLoading={isLoading}
                  >
                    Update Password
                  </Button>
                </Stack>
              </form>
            </Stack>
          </CardContent>

          <CardFooter className="justify-center border-t border-slate-100 bg-slate-50/50 py-4">
            <p className="text-sm text-slate-600">
              Never mind,{" "}
              <Link
                href="/login"
                className="font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
              >
                back to login
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </PageContainer>
  );
}
