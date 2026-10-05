-- ==============================================================================
-- PrepFlow Row-Level Security (RLS) Migration (PF-004)
-- Description: Enable RLS and define strict ownership isolation policies across all public user tables.
-- ==============================================================================

-- 1. Enable Row-Level Security on all 11 public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revision_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
-- Users can view, update, and delete only their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 3. Exams Policies
-- Direct ownership via user_id
CREATE POLICY "exams_select_own"
  ON public.exams
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "exams_insert_own"
  ON public.exams
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exams_update_own"
  ON public.exams
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exams_delete_own"
  ON public.exams
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Books Policies
-- Direct ownership via user_id
CREATE POLICY "books_select_own"
  ON public.books
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "books_insert_own"
  ON public.books
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "books_update_own"
  ON public.books
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "books_delete_own"
  ON public.books
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Book Sections Policies
-- Ownership derived through book_id -> books.user_id
CREATE POLICY "book_sections_select_own"
  ON public.book_sections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_sections.book_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "book_sections_insert_own"
  ON public.book_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_sections.book_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "book_sections_update_own"
  ON public.book_sections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_sections.book_id
        AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_sections.book_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "book_sections_delete_own"
  ON public.book_sections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_sections.book_id
        AND b.user_id = auth.uid()
    )
  );

-- 6. Questions Policies
-- Ownership derived through book_id -> books.user_id
CREATE POLICY "questions_select_own"
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = questions.book_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "questions_insert_own"
  ON public.questions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = questions.book_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "questions_update_own"
  ON public.questions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = questions.book_id
        AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = questions.book_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "questions_delete_own"
  ON public.questions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = questions.book_id
        AND b.user_id = auth.uid()
    )
  );

-- 7. Practice Sessions Policies
-- Direct ownership via user_id
CREATE POLICY "practice_sessions_select_own"
  ON public.practice_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "practice_sessions_insert_own"
  ON public.practice_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = practice_sessions.exam_id
        AND e.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = practice_sessions.book_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "practice_sessions_update_own"
  ON public.practice_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "practice_sessions_delete_own"
  ON public.practice_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 8. Question Attempts Policies
-- Direct ownership via user_id (Immutable historical attempts)
CREATE POLICY "question_attempts_select_own"
  ON public.question_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "question_attempts_insert_own"
  ON public.question_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.books b ON b.id = q.book_id
      WHERE q.id = question_attempts.question_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "question_attempts_delete_own"
  ON public.question_attempts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 9. Daily Goals Policies
-- Direct ownership via user_id
CREATE POLICY "daily_goals_select_own"
  ON public.daily_goals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "daily_goals_insert_own"
  ON public.daily_goals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = daily_goals.exam_id
        AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "daily_goals_update_own"
  ON public.daily_goals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_goals_delete_own"
  ON public.daily_goals
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 10. Revision Queue Policies
-- Direct ownership via user_id
CREATE POLICY "revision_queue_select_own"
  ON public.revision_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "revision_queue_insert_own"
  ON public.revision_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.questions q
      JOIN public.books b ON b.id = q.book_id
      WHERE q.id = revision_queue.question_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "revision_queue_update_own"
  ON public.revision_queue
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "revision_queue_delete_own"
  ON public.revision_queue
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 11. Book Processing Jobs Policies
-- Derived ownership through book_id -> books.user_id
CREATE POLICY "book_processing_jobs_select_own"
  ON public.book_processing_jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_processing_jobs.book_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "book_processing_jobs_insert_own"
  ON public.book_processing_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_processing_jobs.book_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "book_processing_jobs_update_own"
  ON public.book_processing_jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_processing_jobs.book_id
        AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_processing_jobs.book_id
        AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "book_processing_jobs_delete_own"
  ON public.book_processing_jobs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.books b
      WHERE b.id = book_processing_jobs.book_id
        AND b.user_id = auth.uid()
    )
  );

-- 12. Audit Logs Policies
-- Append-only security logs: Users can insert own events and view own actions
CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (actor_id = auth.uid());

CREATE POLICY "audit_logs_insert_own"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id IS NULL OR actor_id = auth.uid());
