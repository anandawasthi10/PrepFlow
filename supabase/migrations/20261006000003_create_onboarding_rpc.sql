-- ==============================================================================
-- Migration: 20261006000003_create_onboarding_rpc.sql
-- Description: Creates the secure, atomic complete_onboarding RPC function
-- Guardrails: SECURITY DEFINER SET search_path = '', restricted to authenticated
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_exam_name TEXT,
  p_exam_date DATE,
  p_daily_goal INTEGER,
  p_timezone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_exam_id UUID;
  v_normalized_tz TEXT;
  v_local_date DATE;
  v_trimmed_name TEXT;
BEGIN
  -- 1. Derive user identity exclusively from authenticated session
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Validate exam name
  v_trimmed_name := pg_catalog.btrim(p_exam_name);
  IF v_trimmed_name IS NULL OR v_trimmed_name = '' THEN
    RAISE EXCEPTION 'Exam name is required';
  END IF;
  IF pg_catalog.length(v_trimmed_name) > 100 THEN
    RAISE EXCEPTION 'Exam name must not exceed 100 characters';
  END IF;

  -- 3. Validate daily question goal
  IF p_daily_goal IS NULL OR p_daily_goal < 1 OR p_daily_goal > 500 THEN
    RAISE EXCEPTION 'Daily question goal must be between 1 and 500';
  END IF;

  -- 4. Normalize and validate timezone against PostgreSQL pg_timezone_names
  IF p_timezone IS NULL OR pg_catalog.btrim(p_timezone) = '' THEN
    v_normalized_tz := 'UTC';
  ELSIF EXISTS (SELECT 1 FROM pg_catalog.pg_timezone_names WHERE name = pg_catalog.btrim(p_timezone)) THEN
    v_normalized_tz := pg_catalog.btrim(p_timezone);
  ELSE
    v_normalized_tz := 'UTC';
  END IF;

  -- 5. Calculate local date in user's normalized timezone and validate exam date
  v_local_date := (pg_catalog.now() AT TIME ZONE v_normalized_tz)::date;

  IF p_exam_date IS NOT NULL AND p_exam_date < v_local_date THEN
    RAISE EXCEPTION 'Exam date cannot be in the past';
  END IF;

  -- 6. Lock the user's profile row for concurrency control
  PERFORM 1 FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user %', v_user_id;
  END IF;

  -- 7. Atomically deactivate any previous active exams for this user
  UPDATE public.exams
  SET is_active = false, updated_at = pg_catalog.now()
  WHERE user_id = v_user_id AND is_active = true;

  -- 8. Insert new active exam
  INSERT INTO public.exams (
    user_id,
    name,
    exam_date,
    daily_question_goal,
    is_active
  )
  VALUES (
    v_user_id,
    v_trimmed_name,
    p_exam_date,
    p_daily_goal,
    true
  )
  RETURNING id INTO v_exam_id;

  -- 9. Update profile timezone and mark onboarding complete
  UPDATE public.profiles
  SET
    timezone = v_normalized_tz,
    onboarding_completed = true,
    updated_at = pg_catalog.now()
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update profile for user %', v_user_id;
  END IF;

  -- 10. Create initial daily_goals row for today in user timezone
  INSERT INTO public.daily_goals (
    user_id,
    exam_id,
    target,
    completed,
    local_date
  )
  VALUES (
    v_user_id,
    v_exam_id,
    p_daily_goal,
    0,
    v_local_date
  )
  ON CONFLICT (user_id, exam_id, local_date) DO NOTHING;

  RETURN v_exam_id;
END;
$$;

-- Security & Permissions: Revoke execution from PUBLIC and anon, grant only to authenticated
REVOKE ALL ON FUNCTION public.complete_onboarding(TEXT, DATE, INTEGER, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_onboarding(TEXT, DATE, INTEGER, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(TEXT, DATE, INTEGER, TEXT) TO authenticated;
