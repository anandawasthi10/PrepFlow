"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { createClient } from "@/lib/supabase/client";
import {
  initiateBookUploadAction,
  completeBookUploadAction,
  cancelBookUploadAction,
} from "@/lib/books/actions";
import { MAX_FILE_SIZE_BYTES, ALLOWED_EXTENSIONS } from "@/lib/books/constants";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ArrowLeft, X } from "lucide-react";

type UploadStep = "idle" | "initiating" | "uploading" | "finalizing" | "success" | "error";

export default function BookUploadPage() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [userConsent, setUserConsent] = React.useState(false);
  const [uploadStep, setUploadStep] = React.useState<UploadStep>("idle");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleFileSelect = (selectedFile: File) => {
    setErrorMessage(null);
    setFieldErrors({});

    // Client-side quick check
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File is too large (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 50 MB.`
      );
      return;
    }

    const lastDotIndex = selectedFile.name.lastIndexOf(".");
    const ext = lastDotIndex > 0 ? selectedFile.name.substring(lastDotIndex).toLowerCase() : "";
    if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
      setErrorMessage("Unsupported file format. Please upload a .pdf, .docx, or .txt file.");
      return;
    }

    setFile(selectedFile);
    if (!title.trim()) {
      // Pre-fill title with human-readable file name
      const cleanName = selectedFile.name.substring(0, lastDotIndex).replace(/[_-]+/g, " ").trim();
      setTitle(cleanName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!file) {
      setErrorMessage("Please select a study document to upload.");
      return;
    }

    if (!userConsent) {
      setErrorMessage("You must confirm you have the right to upload this document.");
      return;
    }

    let activeBookId: string | null = null;

    try {
      // Step 1: Initiate upload on server to obtain canonical path and register row
      setUploadStep("initiating");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("fileName", file.name);
      formData.append("fileSizeBytes", file.size.toString());
      formData.append("mimeType", file.type || "application/octet-stream");
      formData.append("userConsent", "true");

      const initResult = await initiateBookUploadAction(formData);

      if (!initResult.success || !initResult.bookId || !initResult.storagePath) {
        if (initResult.errors) {
          setFieldErrors(initResult.errors);
        }
        setErrorMessage(initResult.error || "Failed to initialize document upload.");
        setUploadStep("error");
        return;
      }

      activeBookId = initResult.bookId;

      // Step 2: Upload directly from browser to private Supabase Storage
      setUploadStep("uploading");
      setUploadProgress(25);

      const supabase = createClient();
      const { error: storageError } = await supabase.storage
        .from("books")
        .upload(initResult.storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (storageError) {
        setErrorMessage("Upload to storage failed. Please check your connection and retry.");
        setUploadStep("error");
        if (activeBookId) {
          await cancelBookUploadAction({ bookId: activeBookId });
        }
        return;
      }

      setUploadProgress(75);

      // Step 3: Complete upload on server (verifies object and creates extraction job)
      setUploadStep("finalizing");
      const completeResult = await completeBookUploadAction({ bookId: activeBookId });

      if (!completeResult.success) {
        setErrorMessage(completeResult.error || "Failed to finalize document processing.");
        setUploadStep("error");
        return;
      }

      setUploadProgress(100);
      setUploadStep("success");

      // Redirect to books library after short delay
      setTimeout(() => {
        router.push(completeResult.redirectTo || "/books");
      }, 1200);
    } catch {
      setErrorMessage("An unexpected network error occurred during upload. Please retry.");
      setUploadStep("error");
      if (activeBookId) {
        await cancelBookUploadAction({ bookId: activeBookId });
      }
    }
  };

  const isBusy =
    uploadStep === "initiating" || uploadStep === "uploading" || uploadStep === "finalizing";

  return (
    <PageContainer size="narrow">
      <div className="py-6 space-y-6">
        <div>
          <Link
            href="/books"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Book Library
          </Link>
          <h1 className="text-2xl font-bold text-slate-950">Upload Study Document</h1>
          <p className="text-sm text-slate-600 mt-1">
            Upload question banks, textbooks, or notes. PrepFlow will extract MCQs and build your
            theory index.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Document Details</CardTitle>
            <CardDescription>Supported formats: PDF, DOCX, TXT up to 50 MB</CardDescription>
          </CardHeader>

          <CardContent>
            <Stack spacing={6}>
              {errorMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                >
                  <AlertCircle
                    className="h-5 w-5 shrink-0 text-red-600 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{errorMessage}</span>
                </div>
              )}

              {uploadStep === "success" && (
                <div
                  role="status"
                  className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
                >
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold">Upload Complete!</p>
                    <p className="text-emerald-700">
                      Document saved and queued for extraction. Redirecting to library...
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={6}>
                  {/* File Dropzone */}
                  {!file ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                        isDragOver
                          ? "border-primary-600 bg-primary-50/50"
                          : "border-slate-300 hover:border-primary-500 bg-slate-50/50 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        id="bookFile"
                        name="bookFile"
                        type="file"
                        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                        className="sr-only"
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 mb-3">
                        <UploadCloud className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800 text-center">
                        Click to select or drag and drop your document
                      </p>
                      <p className="text-xs text-slate-500 mt-1">PDF, DOCX, or TXT up to 50 MB</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                          <FileText className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setTitle("");
                        }}
                        disabled={isBusy}
                        aria-label="Remove selected file"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors disabled:opacity-50"
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  )}

                  {/* Book Title Input */}
                  <Input
                    id="title"
                    name="title"
                    label="Document Title"
                    placeholder="e.g. First Aid for USMLE Step 1 (2024)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    disabled={isBusy}
                    error={fieldErrors.title?.[0]}
                  />

                  {/* Consent Checkbox */}
                  <div className="space-y-1.5 pt-1">
                    <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700">
                      <input
                        id="userConsent"
                        name="userConsent"
                        type="checkbox"
                        checked={userConsent}
                        onChange={(e) => setUserConsent(e.target.checked)}
                        disabled={isBusy}
                        required
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span>
                        I confirm I have the lawful right to upload and process this document for my
                        personal study preparation.
                      </span>
                    </label>
                    {fieldErrors.userConsent?.[0] && (
                      <p role="alert" className="text-xs text-error-700 font-medium">
                        {fieldErrors.userConsent[0]}
                      </p>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  {isBusy && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>
                          {uploadStep === "initiating" && "Registering document..."}
                          {uploadStep === "uploading" && "Uploading to secure storage..."}
                          {uploadStep === "finalizing" && "Finalizing and queueing extraction..."}
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 transition-all duration-300 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="default"
                    className="w-full mt-2"
                    disabled={!file || !title.trim() || !userConsent || isBusy}
                    isLoading={isBusy}
                  >
                    Upload Document
                  </Button>
                </Stack>
              </form>
            </Stack>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
