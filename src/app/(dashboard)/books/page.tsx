import * as React from "react";
import Link from "next/link";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, UploadCloud } from "lucide-react";

export default function BooksPage() {
  return (
    <PageContainer size="default">
      <div className="py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">Book Library</h1>
            <p className="text-sm text-slate-600">
              Manage your uploaded study books, question banks, and notes.
            </p>
          </div>

          <Link href="/books/upload">
            <Button variant="default" className="gap-2">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Upload New Document
            </Button>
          </Link>
        </div>

        <Card className="text-center py-12 px-6">
          <CardHeader className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <BookOpen className="h-7 w-7" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl font-semibold">Your Study Library</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Upload your first book or question bank to generate practice questions, track
              progress, and build your revision queue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/books/upload">
              <Button variant="secondary" className="gap-2">
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                Upload Document
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
