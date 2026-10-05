import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import {
  STORAGE_BUCKET_BOOKS,
  sanitizeFilename,
  getUserBookStoragePath,
  validateBookUpload,
  createBookSignedUrl,
  type StorageClientLike,
} from "@/lib/supabase/storage";

describe("Private Storage Bucket & Security Utilities (PF-005)", () => {
  const migrationPath = path.resolve(
    __dirname,
    "../../../supabase/migrations/20261006000002_create_storage_bucket.sql"
  );

  describe("SQL Migration Inspection", () => {
    it("verifies storage bucket migration file exists with private 50 MB configuration", () => {
      expect(fs.existsSync(migrationPath)).toBe(true);
      const sql = fs.readFileSync(migrationPath, "utf-8");

      expect(sql).toContain(
        "INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)"
      );
      expect(sql).toContain("'books'");
      expect(sql).toContain("false"); // private bucket
      expect(sql).toContain("52428800"); // 50 MB
      expect(sql).toContain("'application/pdf'");
      expect(sql).toContain(
        "'application/vnd.openxmlformats-officedocument.wordprocessingml.document'"
      );
      expect(sql).toContain("'text/plain'");
      expect(sql).toContain("WHERE storage.buckets.id = 'books';");
    });

    it("verifies all 4 discrete storage policies enforce authenticated role, bucket_id = 'books', and two-level ownership", () => {
      const sql = fs.readFileSync(migrationPath, "utf-8");

      const policies = [
        "storage_books_select_own",
        "storage_books_insert_own",
        "storage_books_update_own",
        "storage_books_delete_own",
      ];

      policies.forEach((policy) => {
        expect(sql).toContain(`CREATE POLICY "${policy}"`);
      });

      // Assert TO authenticated (excludes anon)
      expect(sql.match(/TO authenticated/g)).toHaveLength(4);

      // Assert bucket_id = 'books' in every policy
      expect(sql.match(/bucket_id = 'books'/g)?.length).toBeGreaterThanOrEqual(4);

      // Assert user folder check in every policy
      expect(
        sql.match(/\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/g)?.length
      ).toBeGreaterThanOrEqual(4);

      // Assert book ownership lookup in public.books
      expect(
        sql.match(/WHERE b\.id::text = \(storage\.foldername\(name\)\)\[2\]/g)?.length
      ).toBeGreaterThanOrEqual(4);

      // Assert UPDATE has both USING and WITH CHECK clauses
      expect(sql).toContain('CREATE POLICY "storage_books_update_own"');
      expect(sql).toContain("FOR UPDATE");
      expect(sql).toContain("USING (");
      expect(sql).toContain("WITH CHECK (");
    });
  });

  describe("Filename Sanitization & Path Traversal Prevention", () => {
    it("successfully sanitizes valid filenames with spaces and mixed case", () => {
      expect(sanitizeFilename("Biology Chapter 1.pdf")).toBe("Biology-Chapter-1.pdf");
      expect(sanitizeFilename("Organic Chemistry_Notes (v2).docx")).toBe(
        "Organic-Chemistry_Notes-v2.docx"
      );
      expect(sanitizeFilename("sample-test.txt")).toBe("sample-test.txt");
    });

    it("rejects path traversal attempts with '..'", () => {
      expect(() => sanitizeFilename("../secret.pdf")).toThrowError(/path traversal tokens/);
      expect(() => sanitizeFilename("..\\windows\\system32\\config.pdf")).toThrowError(
        /path traversal tokens/
      );
      expect(() => sanitizeFilename("books/../other/file.docx")).toThrowError(
        /path traversal tokens/
      );
    });

    it("rejects forward and backward slashes", () => {
      expect(() => sanitizeFilename("subfolder/file.pdf")).toThrowError(
        /forward and backward slashes/
      );
      expect(() => sanitizeFilename("subfolder\\file.docx")).toThrowError(
        /forward and backward slashes/
      );
    });

    it("rejects null bytes and control characters", () => {
      expect(() => sanitizeFilename("file\0.pdf")).toThrowError(/null bytes or control characters/);
      expect(() => sanitizeFilename("test\x08doc.txt")).toThrowError(
        /null bytes or control characters/
      );
    });

    it("rejects invalid or non-whitelisted extensions", () => {
      expect(() => sanitizeFilename("malware.exe")).toThrowError(/Invalid file extension/);
      expect(() => sanitizeFilename("script.sh")).toThrowError(/Invalid file extension/);
      expect(() => sanitizeFilename("image.png")).toThrowError(/Invalid file extension/);
      expect(() => sanitizeFilename("noextension")).toThrowError(/Invalid file extension/);
    });

    it("rejects empty or whitespace-only filenames", () => {
      expect(() => sanitizeFilename("")).toThrowError(/filename cannot be empty/);
      expect(() => sanitizeFilename("   ")).toThrowError(/filename cannot be empty/);
      expect(() => sanitizeFilename("!@#$.pdf")).toThrowError(/must contain valid alphanumeric/);
    });
  });

  describe("Canonical Storage Path Generation", () => {
    const validUserId = "11111111-1111-4111-8111-111111111111";
    const validBookId = "22222222-2222-4222-8222-222222222222";

    it("generates exact canonical path for valid user and book UUIDs", () => {
      const pathResult = getUserBookStoragePath(validUserId, validBookId, "Textbook (Final).pdf");
      expect(pathResult).toBe(`${validUserId}/${validBookId}/Textbook-Final.pdf`);
    });

    it("rejects invalid user UUID format", () => {
      expect(() => getUserBookStoragePath("invalid-user-id", validBookId, "test.pdf")).toThrowError(
        /Invalid user ID format/
      );
    });

    it("rejects invalid book UUID format", () => {
      expect(() => getUserBookStoragePath(validUserId, "not-a-uuid", "test.pdf")).toThrowError(
        /Invalid book ID format/
      );
    });
  });

  describe("File Upload Validation (50 MB & MIME)", () => {
    it("accepts valid PDF, DOCX, and TXT files under 50 MB", () => {
      expect(
        validateBookUpload({
          size: 10 * 1024 * 1024, // 10 MB
          type: "application/pdf",
          name: "textbook.pdf",
        })
      ).toEqual({ valid: true });

      expect(
        validateBookUpload({
          size: 52_428_800, // Exactly 50 MB
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          name: "notes.docx",
        })
      ).toEqual({ valid: true });

      expect(
        validateBookUpload({
          size: 500,
          type: "text/plain",
          name: "summary.txt",
        })
      ).toEqual({ valid: true });
    });

    it("rejects files exceeding 50 MB (52,428,800 bytes)", () => {
      const result = validateBookUpload({
        size: 52_428_801, // 50 MB + 1 byte
        type: "application/pdf",
        name: "oversized.pdf",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/exceeds the maximum permitted size of 50 MB/);
    });

    it("rejects empty files (0 bytes)", () => {
      const result = validateBookUpload({
        size: 0,
        type: "application/pdf",
        name: "empty.pdf",
      });
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/File cannot be empty/);
    });

    it("rejects unpermitted MIME types and extensions", () => {
      expect(
        validateBookUpload({
          size: 1024,
          type: "image/png",
          name: "photo.png",
        }).valid
      ).toBe(false);

      expect(
        validateBookUpload({
          size: 1024,
          type: "application/pdf",
          name: "fake.exe",
        }).valid
      ).toBe(false);
    });
  });

  describe("Signed URL Expiry Bounds & Execution", () => {
    const validPath =
      "11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/book.pdf";

    const mockSupabase: StorageClientLike = {
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: vi.fn().mockResolvedValue({
            data: {
              signedUrl: "https://mock.supabase.co/storage/v1/object/sign/books/signed-token",
            },
            error: null,
          }),
        }),
      },
    };

    it("successfully creates signed URL with default expiration (600s)", async () => {
      const signedUrl = await createBookSignedUrl(mockSupabase, validPath);
      expect(signedUrl).toContain("https://mock.supabase.co");
      expect(mockSupabase.storage.from).toHaveBeenCalledWith(STORAGE_BUCKET_BOOKS);
    });

    it("accepts custom expiration strictly within 300s–900s range", async () => {
      await expect(createBookSignedUrl(mockSupabase, validPath, 300)).resolves.toBeDefined();
      await expect(createBookSignedUrl(mockSupabase, validPath, 900)).resolves.toBeDefined();
    });

    it("strictly rejects expiration values outside 300–900 seconds", async () => {
      await expect(createBookSignedUrl(mockSupabase, validPath, 299)).rejects.toThrowError(
        /Signed URL expiration must be between 300 and 900 seconds/
      );
      await expect(createBookSignedUrl(mockSupabase, validPath, 901)).rejects.toThrowError(
        /Signed URL expiration must be between 300 and 900 seconds/
      );
      await expect(createBookSignedUrl(mockSupabase, validPath, 0)).rejects.toThrowError(
        /Signed URL expiration must be between 300 and 900 seconds/
      );
      await expect(createBookSignedUrl(mockSupabase, validPath, -100)).rejects.toThrowError(
        /Signed URL expiration must be between 300 and 900 seconds/
      );
      await expect(createBookSignedUrl(mockSupabase, validPath, NaN)).rejects.toThrowError(
        /Signed URL expiration must be between 300 and 900 seconds/
      );
      await expect(createBookSignedUrl(mockSupabase, validPath, Infinity)).rejects.toThrowError(
        /Signed URL expiration must be between 300 and 900 seconds/
      );
    });

    it("rejects non-canonical storage paths", async () => {
      await expect(createBookSignedUrl(mockSupabase, "invalid/path.pdf")).rejects.toThrowError(
        /Invalid storage path format/
      );
    });
  });

  describe("Server-Only Boundary Verification", () => {
    it("verifies src/lib/supabase/storage.ts begins with import 'server-only'", () => {
      const storageModulePath = path.resolve(__dirname, "../../lib/supabase/storage.ts");
      const content = fs.readFileSync(storageModulePath, "utf-8");
      expect(content.startsWith('import "server-only";')).toBe(true);
    });
  });
});
