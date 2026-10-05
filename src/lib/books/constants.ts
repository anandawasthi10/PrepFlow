export const STORAGE_BUCKET_BOOKS = "books";
export const MAX_FILE_SIZE_BYTES = 52_428_800; // Exactly 50 MB in bytes (50 * 1024 * 1024)
export const MIN_SIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes
export const MAX_SIGNED_URL_EXPIRY_SECONDS = 900; // 15 minutes
export const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 600; // 10 minutes

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates and sanitizes a raw user filename.
 * Rejects path traversal, separators, control characters, null bytes, empty names, and non-whitelisted extensions.
 */
export function sanitizeFilename(rawFilename: string): string {
  if (typeof rawFilename !== "string" || !rawFilename.trim()) {
    throw new Error("Invalid filename: filename cannot be empty.");
  }

  // Reject null bytes and control characters
  if (/[\x00-\x1F\x7F]/.test(rawFilename)) {
    throw new Error("Invalid filename: null bytes or control characters detected.");
  }

  // Reject path traversal tokens
  if (rawFilename.includes("..")) {
    throw new Error("Invalid filename: path traversal tokens ('..') are not permitted.");
  }

  // Reject forward and backward slashes
  if (rawFilename.includes("/") || rawFilename.includes("\\")) {
    throw new Error("Invalid filename: forward and backward slashes are not permitted.");
  }

  const lastDotIndex = rawFilename.lastIndexOf(".");
  if (lastDotIndex <= 0) {
    throw new Error("Invalid file extension: must be .pdf, .docx, or .txt.");
  }

  const baseName = rawFilename.substring(0, lastDotIndex);
  const rawExtension = rawFilename.substring(lastDotIndex).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(rawExtension as AllowedExtension)) {
    throw new Error("Invalid file extension: must be .pdf, .docx, or .txt.");
  }

  // Sanitize base name: keep alphanumeric, hyphens, and underscores; replace spaces with hyphens
  const sanitizedBase = baseName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!sanitizedBase) {
    throw new Error("Invalid filename: filename must contain valid alphanumeric characters.");
  }

  return `${sanitizedBase}${rawExtension}`;
}

/**
 * Generates the canonical storage path: `{userId}/{bookId}/{sanitizedFilename}`
 */
export function getUserBookStoragePath(userId: string, bookId: string, filename: string): string {
  if (!UUID_REGEX.test(userId)) {
    throw new Error("Invalid user ID format: must be a valid UUID.");
  }

  if (!UUID_REGEX.test(bookId)) {
    throw new Error("Invalid book ID format: must be a valid UUID.");
  }

  const safeFilename = sanitizeFilename(filename);
  return `${userId}/${bookId}/${safeFilename}`;
}

/**
 * Validates uploaded file metadata (size, MIME type, extension).
 */
export function validateBookUpload(file: { size: number; type: string; name: string }): {
  valid: boolean;
  error?: string;
} {
  if (file.size <= 0) {
    return { valid: false, error: "File cannot be empty." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "File exceeds the maximum permitted size of 50 MB." };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    return {
      valid: false,
      error: `Unsupported MIME type '${file.type}'. Allowed types: PDF, DOCX, TXT.`,
    };
  }

  const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension as AllowedExtension)) {
    return {
      valid: false,
      error: `Unsupported file extension '${extension}'. Allowed extensions: .pdf, .docx, .txt.`,
    };
  }

  return { valid: true };
}
