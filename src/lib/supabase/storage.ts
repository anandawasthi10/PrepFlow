import "server-only";

export {
  STORAGE_BUCKET_BOOKS,
  MAX_FILE_SIZE_BYTES,
  MIN_SIGNED_URL_EXPIRY_SECONDS,
  MAX_SIGNED_URL_EXPIRY_SECONDS,
  DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  type AllowedMimeType,
  type AllowedExtension,
  sanitizeFilename,
  getUserBookStoragePath,
  validateBookUpload,
} from "@/lib/books/constants";

import {
  STORAGE_BUCKET_BOOKS,
  DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
  MIN_SIGNED_URL_EXPIRY_SECONDS,
  MAX_SIGNED_URL_EXPIRY_SECONDS,
} from "@/lib/books/constants";

const CANONICAL_PATH_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-zA-Z0-9_-]+\.(pdf|docx|txt)$/i;

export interface StorageClientLike {
  storage: {
    from: (bucket: string) => {
      createSignedUrl: (
        path: string,
        expiresIn: number
      ) => Promise<{ data: { signedUrl: string } | null; error: unknown }>;
    };
  };
}

/**
 * Creates a short-lived signed URL for a book file in the private 'books' bucket.
 * Expiration is strictly bounded between 300 and 900 seconds (5 to 15 minutes).
 */
export async function createBookSignedUrl(
  supabase: StorageClientLike,
  storagePath: string,
  expiresInSeconds: number = DEFAULT_SIGNED_URL_EXPIRY_SECONDS
): Promise<string> {
  if (
    typeof expiresInSeconds !== "number" ||
    !Number.isFinite(expiresInSeconds) ||
    expiresInSeconds < MIN_SIGNED_URL_EXPIRY_SECONDS ||
    expiresInSeconds > MAX_SIGNED_URL_EXPIRY_SECONDS
  ) {
    throw new Error("Signed URL expiration must be between 300 and 900 seconds (5 to 15 minutes).");
  }

  if (!CANONICAL_PATH_REGEX.test(storagePath)) {
    throw new Error("Invalid storage path format: must be {userId}/{bookId}/{filename}.");
  }

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET_BOOKS)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error("Failed to generate signed URL for book storage.");
  }

  return data.signedUrl;
}
