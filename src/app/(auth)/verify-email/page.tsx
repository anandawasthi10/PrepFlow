import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { MailCheck } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <PageContainer size="narrow">
      <div className="flex flex-col items-center justify-center min-h-[75vh]">
        <Card className="w-full max-w-md text-center p-6 md:p-8">
          <Stack spacing={6} align="center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-700">
              <MailCheck className="h-7 w-7" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-950">Check your inbox</h1>
              <p className="text-sm text-slate-600">
                We sent a verification link to your email address. Please click the link to confirm
                your account before logging in.
              </p>
            </div>
            <Link href="/login" className="w-full">
              <Button variant="secondary" className="w-full">
                Back to Login
              </Button>
            </Link>
          </Stack>
        </Card>
      </div>
    </PageContainer>
  );
}
