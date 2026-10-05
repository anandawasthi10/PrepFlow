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
import { signupUserAction } from "@/lib/auth/actions";
import { Mail } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [timezone, setTimezone] = React.useState("UTC");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [requiresVerification, setRequiresVerification] = React.useState(true);

  React.useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
      }
    } catch {
      setTimezone("UTC");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("confirmPassword", confirmPassword);
    formData.append("timezone", timezone);

    try {
      const result = await signupUserAction(formData);

      if (result.success) {
        if (result.requiresVerification) {
          setIsSuccess(true);
          setRequiresVerification(true);
        } else {
          router.push("/onboarding");
        }
      } else if (result.errors) {
        setErrors(result.errors);
      }
    } catch {
      setErrors({
        _form: ["An unexpected error occurred. Please try again."],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess && requiresVerification) {
    return (
      <PageContainer size="narrow">
        <div className="flex flex-col items-center justify-center min-h-[75vh]">
          <Card className="w-full max-w-md text-center p-6 md:p-8">
            <Stack spacing={6} align="center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                <Mail className="h-7 w-7" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-slate-950">Verify your email</h1>
                <p className="text-sm text-slate-600">
                  We sent a confirmation link to{" "}
                  <span className="font-semibold text-slate-900">{email}</span>. Please click the
                  link in the email to activate your PrepFlow account.
                </p>
              </div>
              <Link href="/login" className="w-full">
                <Button variant="secondary" className="w-full">
                  Proceed to Login
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
      <div className="flex flex-col items-center justify-center min-h-[85vh] py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700 text-white font-bold text-sm">
                PF
              </div>
              <span className="text-lg font-bold text-slate-950">PrepFlow</span>
            </div>
            <CardTitle className="text-xl">Create your account</CardTitle>
            <CardDescription>
              Start structured exam practice with source-grounded tracking.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate>
            <CardContent>
              <Stack spacing={4}>
                {errors._form && (
                  <div
                    role="alert"
                    className="p-3 rounded-lg bg-error-100 text-error-700 text-xs font-medium border border-error-700/20"
                  >
                    {errors._form.join(" ")}
                  </div>
                )}

                <Input
                  label="Full Name (optional)"
                  id="fullName"
                  name="fullName"
                  placeholder="e.g. Anand Awasthi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  error={errors.fullName?.[0]}
                  autoComplete="name"
                  disabled={isLoading}
                />

                <Input
                  label="Email address"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email?.[0]}
                  autoComplete="email"
                  required
                  disabled={isLoading}
                />

                <Input
                  label="Password"
                  id="password"
                  name="password"
                  type="password"
                  placeholder="At least 8 characters (letter + number)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password?.[0]}
                  helperText="Minimum 8 characters with at least one letter and one number."
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                />

                <Input
                  label="Confirm Password"
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword?.[0]}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                />

                <input type="hidden" name="timezone" value={timezone} />

                <Button
                  type="submit"
                  variant="default"
                  className="w-full mt-2"
                  isLoading={isLoading}
                >
                  Create Account
                </Button>
              </Stack>
            </CardContent>

            <CardFooter className="flex justify-center border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-primary-700 hover:text-primary-600 underline underline-offset-4"
                >
                  Log in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </PageContainer>
  );
}
