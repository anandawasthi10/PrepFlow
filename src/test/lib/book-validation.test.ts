import { describe, it, expect } from "vitest";
import {
  initiateBookUploadSchema,
  completeBookUploadSchema,
  cancelBookUploadSchema,
} from "@/lib/validations/book";
import { MAX_FILE_SIZE_BYTES } from "@/lib/supabase/storage";

describe("Book Upload Validation Schemas (PF-010)", () => {
  describe("initiateBookUploadSchema", () => {
    it("accepts valid book upload metadata", () => {
      const result = initiateBookUploadSchema.safeParse({
        title: "First Aid for USMLE Step 1",
        fileName: "first-aid-2024.pdf",
        fileSizeBytes: 10_000_000,
        mimeType: "application/pdf",
        userConsent: true,
      });

      expect(result.success).toBe(true);
    });

    it("rejects file size exceeding 50 MB", () => {
      const result = initiateBookUploadSchema.safeParse({
        title: "Large Textbook",
        fileName: "textbook.pdf",
        fileSizeBytes: MAX_FILE_SIZE_BYTES + 1, // 50MB + 1 byte
        mimeType: "application/pdf",
        userConsent: true,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.fileSizeBytes).toBeDefined();
      }
    });

    it("rejects empty files (0 bytes)", () => {
      const result = initiateBookUploadSchema.safeParse({
        title: "Empty Document",
        fileName: "empty.txt",
        fileSizeBytes: 0,
        mimeType: "text/plain",
        userConsent: true,
      });

      expect(result.success).toBe(false);
    });

    it("rejects unsupported extensions and MIME types", () => {
      const resultExt = initiateBookUploadSchema.safeParse({
        title: "Malicious File",
        fileName: "script.exe",
        fileSizeBytes: 1000,
        mimeType: "application/x-msdownload",
        userConsent: true,
      });
      expect(resultExt.success).toBe(false);

      const resultMime = initiateBookUploadSchema.safeParse({
        title: "Image File",
        fileName: "photo.pdf",
        fileSizeBytes: 1000,
        mimeType: "image/png",
        userConsent: true,
      });
      expect(resultMime.success).toBe(false);
    });

    it("rejects missing user consent", () => {
      const result = initiateBookUploadSchema.safeParse({
        title: "First Aid",
        fileName: "first-aid.pdf",
        fileSizeBytes: 5000,
        mimeType: "application/pdf",
        userConsent: false,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.userConsent).toContain(
          "You must confirm you have the right to upload and process this document"
        );
      }
    });
  });

  describe("completeBookUploadSchema", () => {
    it("accepts valid UUID bookId", () => {
      const result = completeBookUploadSchema.safeParse({
        bookId: "12345678-1234-1234-1234-123456789abc",
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-UUID bookId", () => {
      const result = completeBookUploadSchema.safeParse({
        bookId: "invalid-book-id",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("cancelBookUploadSchema", () => {
    it("accepts valid UUID bookId", () => {
      const result = cancelBookUploadSchema.safeParse({
        bookId: "12345678-1234-1234-1234-123456789abc",
      });
      expect(result.success).toBe(true);
    });
  });
});
