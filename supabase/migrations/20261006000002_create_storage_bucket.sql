-- ==============================================================================
-- PrepFlow Private Storage Bucket Migration (PF-005)
-- Description: Create private books bucket and enforce granular user-scoped RLS policies on storage.objects.
-- ==============================================================================

-- 1. Idempotent Private Bucket Configuration
-- Configures books bucket with exact 50 MB limit and allowed MIME types (PDF, DOCX, TXT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'books',
  'books',
  false,
  52428800, -- 50 MB in bytes (50 * 1024 * 1024)
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]::text[]
WHERE storage.buckets.id = 'books';

-- 2. Storage Objects Row-Level Security Policies (Scoped strictly to bucket_id = 'books')
-- Path Convention: {user_id}/{book_id}/{filename}

-- 2.1 SELECT Policy (Authenticated owner read access)
CREATE POLICY "storage_books_select_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'books'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND b.user_id = auth.uid()
    )
  );

-- 2.2 INSERT Policy (Authenticated owner upload access)
CREATE POLICY "storage_books_insert_own"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'books'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND b.user_id = auth.uid()
    )
  );

-- 2.3 UPDATE Policy (Protects both original and replacement paths)
CREATE POLICY "storage_books_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'books'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'books'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND b.user_id = auth.uid()
    )
  );

-- 2.4 DELETE Policy (Authenticated owner deletion access)
CREATE POLICY "storage_books_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'books'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND b.user_id = auth.uid()
    )
  );
