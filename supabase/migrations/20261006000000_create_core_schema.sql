-- ==============================================================================
-- PrepFlow Database Schema Migration (PF-003)
-- Description: Core relational schema, enums, triggers, and indexes.
-- ==============================================================================

-- 1. Custom PostgreSQL Enums
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.document_type AS ENUM ('question_bank', 'theory', 'mixed', 'unknown');
CREATE TYPE public.processing_status AS ENUM ('uploading', 'processing', 'ready', 'failed');
CREATE TYPE public.section_type AS ENUM ('theory', 'question_bank', 'mixed');
CREATE TYPE public.question_source_type AS ENUM ('extracted', 'ai_generated');
CREATE TYPE public.mcq_option_key AS ENUM ('A', 'B', 'C', 'D');
CREATE TYPE public.practice_mode AS ENUM ('sequential', 'theory', 'revision', 'topic');
CREATE TYPE public.attempt_result AS ENUM ('correct', 'incorrect', 'skipped', 'unsure');
CREATE TYPE public.revision_status AS ENUM ('due', 'reviewed', 'mastered');
CREATE TYPE public.job_type AS ENUM ('extraction', 'classification', 'indexing', 'cleanup');
CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- 2. Generic Trigger Functions

-- 2.1 Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END;
$$;

-- 2.2 Sync daily_goals.is_completed invariant
CREATE OR REPLACE FUNCTION public.sync_daily_goal_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.is_completed := (NEW.completed >= NEW.target);
  RETURN NEW;
END;
$$;

-- 3. Core Relational Tables

-- 3.1 Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.2 Exams (1 active profile per user in v1)
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exam_date DATE,
  daily_question_goal INTEGER NOT NULL DEFAULT 20 CHECK (daily_question_goal > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE UNIQUE INDEX idx_exams_user_single_active 
  ON public.exams (user_id) 
  WHERE (is_active = true);

CREATE INDEX idx_exams_user ON public.exams (user_id);

CREATE TRIGGER trg_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.3 Books
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  document_type public.document_type NOT NULL DEFAULT 'unknown'::public.document_type,
  processing_status public.processing_status NOT NULL DEFAULT 'uploading'::public.processing_status,
  vector_store_id TEXT,
  file_size_bytes BIGINT CHECK (file_size_bytes > 0),
  page_count INTEGER CHECK (page_count > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX idx_books_user ON public.books (user_id);
CREATE INDEX idx_books_status ON public.books (processing_status);

CREATE TRIGGER trg_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.4 Book Sections
CREATE TABLE public.book_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL CHECK (sequence_order > 0),
  title TEXT NOT NULL,
  section_type public.section_type NOT NULL DEFAULT 'theory'::public.section_type,
  subject TEXT,
  chapter TEXT,
  start_page INTEGER CHECK (start_page > 0),
  end_page INTEGER CHECK (end_page >= start_page),
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX idx_book_sections_order ON public.book_sections (book_id, sequence_order);

CREATE TRIGGER trg_book_sections_updated_at
  BEFORE UPDATE ON public.book_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.5 Questions
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  source_type public.question_source_type NOT NULL,
  sequence_no INTEGER NOT NULL CHECK (sequence_no > 0),
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option public.mcq_option_key NOT NULL,
  explanation TEXT,
  source_refs JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_questions_book_sequence UNIQUE (book_id, sequence_no)
);

CREATE INDEX idx_questions_book_source ON public.questions (book_id, source_type);

CREATE TRIGGER trg_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.6 Practice Sessions
CREATE TABLE public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  mode public.practice_mode NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  end_time TIMESTAMPTZ,
  counters JSONB NOT NULL DEFAULT '{"total": 0, "correct": 0, "incorrect": 0, "skipped": 0, "unsure": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX idx_sessions_user_time ON public.practice_sessions (user_id, start_time DESC);

CREATE TRIGGER trg_practice_sessions_updated_at
  BEFORE UPDATE ON public.practice_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.7 Question Attempts (Immutable attempt history)
CREATE TABLE public.question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.practice_sessions(id) ON DELETE SET NULL,
  mode public.practice_mode NOT NULL,
  selected_option public.mcq_option_key,
  result public.attempt_result NOT NULL,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX idx_attempts_user_time ON public.question_attempts (user_id, attempted_at DESC);
CREATE INDEX idx_attempts_question ON public.question_attempts (question_id);

-- 3.8 Daily Goals
CREATE TABLE public.daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  local_date DATE NOT NULL,
  target INTEGER NOT NULL CHECK (target > 0),
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed >= 0),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_daily_goals_user_exam_date UNIQUE (user_id, exam_id, local_date)
);

CREATE INDEX idx_daily_goals_user_date ON public.daily_goals (user_id, local_date DESC);

CREATE TRIGGER trg_daily_goals_sync_completion
  BEFORE INSERT OR UPDATE ON public.daily_goals
  FOR EACH ROW EXECUTE FUNCTION public.sync_daily_goal_completion();

CREATE TRIGGER trg_daily_goals_updated_at
  BEFORE UPDATE ON public.daily_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.9 Revision Queue (Deduplicated per user + question)
CREATE TABLE public.revision_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  due_at TIMESTAMPTZ NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 1 CHECK (interval_days > 0),
  review_count INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  status public.revision_status NOT NULL DEFAULT 'due'::public.revision_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT uq_revision_queue_user_question UNIQUE (user_id, question_id)
);

CREATE INDEX idx_revision_user_due ON public.revision_queue (user_id, status, due_at);

CREATE TRIGGER trg_revision_queue_updated_at
  BEFORE UPDATE ON public.revision_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.10 Book Processing Jobs (Inngest job tracking)
CREATE TABLE public.book_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  type public.job_type NOT NULL,
  status public.job_status NOT NULL DEFAULT 'pending'::public.job_status,
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  safe_error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX idx_jobs_book_status ON public.book_processing_jobs (book_id, status);

CREATE TRIGGER trg_book_processing_jobs_updated_at
  BEFORE UPDATE ON public.book_processing_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.11 Audit Logs (Append-only security log)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  resource TEXT NOT NULL,
  safe_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.now()
);

CREATE INDEX idx_audit_actor_time ON public.audit_logs (actor_id, timestamp DESC);
CREATE INDEX idx_audit_event ON public.audit_logs (event_type);

-- 4. Auth Signup Trigger (Automatic Profile Creation)
-- Hardened with SECURITY DEFINER SET search_path = '' and fully qualified names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    timezone,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', ''),
    'user'::public.user_role,
    coalesce(NEW.raw_user_meta_data->>'timezone', 'UTC'),
    false
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
