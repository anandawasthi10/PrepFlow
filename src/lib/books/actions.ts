"use server";

import { createClient } from "@/lib/supabase/server";
import {
  initiateBookUploadSchema,
  completeBookUploadSchema,
  cancelBookUploadSchema,
} from "@/lib/validations/book";
import {
  STORAGE_BUCKET_BOOKS,
  sanitizeFilename,
  getUserBookStoragePath,
} from "@/lib/supabase/storage";

export interface InitiateBookActionResult {
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
  bookId?: string;
  storagePath?: string;
  sanitizedFilename?: string;
}

export interface CompleteBookActionResult {
  success: boolean;
  error?: string;
  errors?: Record<string, string[]>;
  bookId?: string;
  jobId?: string;
  redirectTo?: string;
}

export interface CancelBookActionResult {
  success: boolean;
  error?: string;
}

/**
 * Initiates a book upload protocol.
 * Generates canonical server path and registers initial uploading record.
 */
export async function initiateBookUploadAction(
  formData: FormData
): Promise<InitiateBookActionResult> {
  const rawTitle = formData.get("title");
  const rawFileName = formData.get("fileName");
  const rawFileSize = formData.get("fileSizeBytes");
  const rawMimeType = formData.get("mimeType");
  const rawConsent = formData.get("userConsent");

  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  const fileName = typeof rawFileName === "string" ? rawFileName.trim() : "";
  const mimeType = typeof rawMimeType === "string" ? rawMimeType.trim() : "";
  const userConsent = rawConsent === "true" || rawConsent === "on";

  let fileSizeBytes = 0;
  if (typeof rawFileSize === "string") {
    const parsed = Number.parseInt(rawFileSize.trim(), 10);
    if (!Number.isNaN(parsed)) {
      fileSizeBytes = parsed;
    }
  }

  const validationResult = initiateBookUploadSchema.safeParse({
    title,
    fileName,
    fileSizeBytes,
    mimeType,
    userConsent,
  });

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    return {
      success: false,
      errors: fieldErrors,
    };
  }

  try {
    const supabase = await createClient();

    // 1. Verify session identity
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be signed in to upload study documents.",
      };
    }

    // 2. Generate canonical ID, sanitized filename, and storage path
    const bookId = crypto.randomUUID();
    const safeFilename = sanitizeFilename(validationResult.data.fileName);
    const storagePath = getUserBookStoragePath(user.id, bookId, safeFilename);

    // 3. Insert book in 'uploading' status
    const { error: insertError } = await supabase.from("books").insert({
      id: bookId,
      user_id: user.id,
      title: validationResult.data.title,
      storage_path: storagePath,
      document_type: "unknown",
      processing_status: "uploading",
      file_size_bytes: validationResult.data.fileSizeBytes,
    });

    if (insertError) {
      return {
        success: false,
        error: "Unable to initiate document upload. Please try again.",
      };
    }

    return {
      success: true,
      bookId,
      storagePath,
      sanitizedFilename: safeFilename,
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

/**
 * Finalizes book upload, verifies storage object existence, and queues background extraction job via RPC.
 * Accepts STRICTLY bookId from client.
 */
export async function completeBookUploadAction(input: {
  bookId: string;
}): Promise<CompleteBookActionResult> {
  const validationResult = completeBookUploadSchema.safeParse(input);

  if (!validationResult.success) {
    const fieldErrors = validationResult.error.flatten().fieldErrors;
    return {
      success: false,
      errors: fieldErrors,
    };
  }

  try {
    const supabase = await createClient();

    // 1. Verify session identity
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "You must be signed in to complete book upload.",
      };
    }

    const { bookId } = validationResult.data;

    // 2. Fetch owned book row to derive canonical path and verify status
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, storage_path, processing_status")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .single();

    if (bookError || !book) {
      return {
        success: false,
        error: "Book not found or unauthorized.",
      };
    }

    if (book.processing_status !== "uploading") {
      return {
        success: false,
        error: `Book is already in ${book.processing_status} status.`,
      };
    }

    // 3. Verify object exists in storage bucket before completing
    const { data: signedData, error: storageCheckError } = await supabase.storage
      .from(STORAGE_BUCKET_BOOKS)
      .createSignedUrl(book.storage_path, 300);

    if (storageCheckError || !signedData?.signedUrl) {
      return {
        success: false,
        error: "Uploaded file could not be verified in secure storage. Please retry.",
      };
    }

    // 4. Call atomic complete_book_upload RPC
    const { data: jobId, error: rpcError } = await supabase.rpc("complete_book_upload", {
      p_book_id: bookId,
    });

    if (rpcError) {
      return {
        success: false,
        error: "Unable to finalize document processing. Please try again.",
      };
    }

    return {
      success: true,
      bookId,
      jobId: typeof jobId === "string" ? jobId : undefined,
      redirectTo: "/books",
    };
  } catch {
    return {
      success: false,
      error: "An unexpected error occurred while finalizing the upload.",
    };
  }
}

/**
 * Cancels an in-progress upload, removing the storage object and cleaning up unfinalized records.
 * Accepts STRICTLY bookId from client.
 */
export async function cancelBookUploadAction(input: {
  bookId: string;
}): Promise<CancelBookActionResult> {
  const validationResult = cancelBookUploadSchema.safeParse(input);

  if (!validationResult.success) {
    return {
      success: false,
      error: "Invalid book ID format.",
    };
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Unauthorized.",
      };
    }

    const { bookId } = validationResult.data;

    // Fetch owned book in uploading status
    const { data: book } = await supabase
      .from("books")
      .select("id, storage_path, processing_status")
      .eq("id", bookId)
      .eq("user_id", user.id)
      .eq("processing_status", "uploading")
      .single();

    if (book) {
      // Remove storage object (best effort)
      try {
        await supabase.storage.from(STORAGE_BUCKET_BOOKS).remove([book.storage_path]);
      } catch {
        // Storage removal error logged/handled without blocking database cleanup
      }

      // Delete the unfinalized book row
      await supabase.from("books").delete().eq("id", bookId).eq("user_id", user.id);
    }

    return {
      success: true,
    };
  } catch {
    return {
      success: false,
      error: "Unable to cancel upload.",
    };
  }
}
