-- ==============================================================================
-- Migration: 20261006000004_create_book_upload_rpc.sql
-- Description: Creates the complete_book_upload RPC and prevents duplicate extraction jobs
-- Guardrails: SECURITY DEFINER SET search_path = '', restricted to authenticated
-- ==============================================================================

-- 1. Enforce at most one extraction job per book at the database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_book_jobs_single_extraction
  ON public.book_processing_jobs (book_id, type)
  WHERE (type = 'extraction'::public.job_type);

-- 2. Create the secure atomic complete_book_upload RPC function
CREATE OR REPLACE FUNCTION public.complete_book_upload(
  p_book_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_job_id UUID;
  v_current_status public.processing_status;
BEGIN
  -- 1. Derive user identity exclusively from authenticated session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Lock the book row for update and verify ownership
  SELECT processing_status INTO v_current_status
  FROM public.books
  WHERE id = p_book_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Book not found or unauthorized';
  END IF;

  -- 3. Enforce valid one-time transition: uploading -> processing
  IF v_current_status != 'uploading'::public.processing_status THEN
    RAISE EXCEPTION 'Invalid status transition: book is already %', v_current_status;
  END IF;

  -- 4. Check for existing extraction job
  IF EXISTS (
    SELECT 1 FROM public.book_processing_jobs
    WHERE book_id = p_book_id AND type = 'extraction'::public.job_type
  ) THEN
    RAISE EXCEPTION 'An extraction job already exists for book %', p_book_id;
  END IF;

  -- 5. Transition status to processing
  UPDATE public.books
  SET
    processing_status = 'processing'::public.processing_status,
    updated_at = pg_catalog.now()
  WHERE id = p_book_id AND user_id = v_user_id;

  -- 6. Atomically insert single extraction processing job in pending status
  INSERT INTO public.book_processing_jobs (
    book_id,
    type,
    status,
    retry_count
  )
  VALUES (
    p_book_id,
    'extraction'::public.job_type,
    'pending'::public.job_status,
    0
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- 3. Security & Permissions: Revoke execution from PUBLIC and anon, grant only to authenticated
REVOKE ALL ON FUNCTION public.complete_book_upload(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_book_upload(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_book_upload(UUID) TO authenticated;
