import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  initiateBookUploadAction,
  completeBookUploadAction,
  cancelBookUploadAction,
} from "@/lib/books/actions";
import * as serverSupabase from "@/lib/supabase/server";

describe("Book Upload Server Actions (PF-010)", () => {
  const mockGetUser = vi.fn();
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockDelete = vi.fn();
  const mockRpc = vi.fn();
  const mockCreateSignedUrl = vi.fn();
  const mockRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    const mockFrom = vi.fn((table: string) => {
      if (table === "books") {
        return {
          insert: mockInsert,
          select: mockSelect,
          delete: mockDelete,
        };
      }
      return {};
    });

    const mockStorage = {
      from: vi.fn((bucket: string) => {
        if (bucket === "books") {
          return {
            createSignedUrl: mockCreateSignedUrl,
            remove: mockRemove,
          };
        }
        return {};
      }),
    };

    vi.spyOn(serverSupabase, "createClient").mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
      from: mockFrom,
      storage: mockStorage,
      rpc: mockRpc,
    } as unknown as Awaited<ReturnType<typeof serverSupabase.createClient>>);
  });

  const mockUserId = "11111111-1111-4111-8111-111111111111";
  const mockBookId = "22222222-2222-4222-8222-222222222222";

  describe("initiateBookUploadAction", () => {
    it("successfully creates uploading book record and generates canonical path", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId, email: "student@example.com" } },
        error: null,
      });
      mockInsert.mockResolvedValue({ error: null });

      const formData = new FormData();
      formData.append("title", "USMLE Step 1 Review");
      formData.append("fileName", "review_doc.pdf");
      formData.append("fileSizeBytes", "5000000");
      formData.append("mimeType", "application/pdf");
      formData.append("userConsent", "true");

      const result = await initiateBookUploadAction(formData);

      expect(result.success).toBe(true);
      expect(result.bookId).toBeDefined();
      expect(result.sanitizedFilename).toBe("review_doc.pdf");
      expect(result.storagePath).toBe(`${mockUserId}/${result.bookId}/review_doc.pdf`);

      expect(mockInsert).toHaveBeenCalledWith({
        id: result.bookId,
        user_id: mockUserId,
        title: "USMLE Step 1 Review",
        storage_path: `${mockUserId}/${result.bookId}/review_doc.pdf`,
        document_type: "unknown",
        processing_status: "uploading",
        file_size_bytes: 5000000,
      });
    });

    it("rejects unauthenticated user", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "No session" },
      });

      const formData = new FormData();
      formData.append("title", "Test");
      formData.append("fileName", "test.pdf");
      formData.append("fileSizeBytes", "1000");
      formData.append("mimeType", "application/pdf");
      formData.append("userConsent", "true");

      const result = await initiateBookUploadAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("must be signed in");
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe("completeBookUploadAction", () => {
    it("accepts only bookId, verifies storage object, and calls atomic RPC", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBookId,
            storage_path: `${mockUserId}/${mockBookId}/safe.pdf`,
            processing_status: "uploading",
          },
          error: null,
        }),
      };
      mockSelect.mockReturnValue(mockQueryChain);

      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: "https://mock.storage/signed" },
        error: null,
      });

      mockRpc.mockResolvedValue({
        data: "mock-job-id",
        error: null,
      });

      const result = await completeBookUploadAction({
        bookId: mockBookId,
      });

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBe("/books");
      expect(result.jobId).toBe("mock-job-id");

      expect(mockCreateSignedUrl).toHaveBeenCalledWith(`${mockUserId}/${mockBookId}/safe.pdf`, 300);
      expect(mockRpc).toHaveBeenCalledWith("complete_book_upload", {
        p_book_id: mockBookId,
      });
    });

    it("rejects completion if storage object does not exist", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBookId,
            storage_path: `${mockUserId}/${mockBookId}/missing.pdf`,
            processing_status: "uploading",
          },
          error: null,
        }),
      };
      mockSelect.mockReturnValue(mockQueryChain);

      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: "Object not found" },
      });

      const result = await completeBookUploadAction({
        bookId: mockBookId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("could not be verified in secure storage");
      expect(mockRpc).not.toHaveBeenCalled();
    });
  });

  describe("cancelBookUploadAction", () => {
    it("deletes storage object and cleans up unfinalized uploading book row", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      });

      const mockQueryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBookId,
            storage_path: `${mockUserId}/${mockBookId}/file.pdf`,
            processing_status: "uploading",
          },
        }),
      };
      mockSelect.mockReturnValue(mockQueryChain);

      const mockDeleteChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      mockDelete.mockReturnValue(mockDeleteChain);

      mockRemove.mockResolvedValue({ data: [], error: null });

      const result = await cancelBookUploadAction({
        bookId: mockBookId,
      });

      expect(result.success).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith([`${mockUserId}/${mockBookId}/file.pdf`]);
    });
  });
});
