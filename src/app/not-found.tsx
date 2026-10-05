import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <PageContainer size="narrow">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Stack spacing={6} align="center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <FileQuestion className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-950">Page Not Found</h1>
            <p className="text-sm text-slate-600 max-w-sm">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>
          <Link href="/">
            <Button variant="default">Return Home</Button>
          </Link>
        </Stack>
      </div>
    </PageContainer>
  );
}
