import { z } from "zod";
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES, sanitizeFilename } from "@/lib/books/constants";

export const initiateBookUploadSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Book title is required")
    .max(200, "Book title must not exceed 200 characters"),
  fileName: z
    .string()
    .trim()
    .min(1, "File name is required")
    .max(255, "File name is too long")
    .refine((name) => {
      try {
        sanitizeFilename(name);
        return true;
      } catch {
        return false;
      }
    }, "File name is invalid or has an unsupported extension (must be .pdf, .docx, or .txt)"),
  fileSizeBytes: z
    .number({ invalid_type_error: "File size must be a number" })
    .int("File size must be an integer")
    .min(1, "File cannot be empty")
    .max(
      MAX_FILE_SIZE_BYTES,
      `File size exceeds the maximum limit of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`
    ),
  mimeType: z
    .string()
    .trim()
    .refine(
      (type) => (ALLOWED_MIME_TYPES as readonly string[]).includes(type),
      "Unsupported MIME type. Please upload a PDF, DOCX, or TXT file."
    ),
  userConsent: z.boolean().refine((val) => val === true, {
    message: "You must confirm you have the right to upload and process this document",
  }),
});

export type InitiateBookUploadInput = z.infer<typeof initiateBookUploadSchema>;

export const completeBookUploadSchema = z.object({
  bookId: z.string().uuid("Invalid book ID format"),
});

export type CompleteBookUploadInput = z.infer<typeof completeBookUploadSchema>;

export const cancelBookUploadSchema = z.object({
  bookId: z.string().uuid("Invalid book ID format"),
});

export type CancelBookUploadInput = z.infer<typeof cancelBookUploadSchema>;
