import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("complete_onboarding RPC Migration Contract (PF-009)", () => {
  const migrationPath = path.resolve(
    __dirname,
    "../../../supabase/migrations/20261006000003_create_onboarding_rpc.sql"
  );
  const migrationContent = fs.readFileSync(migrationPath, "utf-8");

  it("defines SECURITY DEFINER SET search_path = ''", () => {
    expect(migrationContent).toContain("SECURITY DEFINER");
    expect(migrationContent).toContain("SET search_path = ''");
  });

  it("revokes execution from PUBLIC and anon, grants to authenticated", () => {
    expect(migrationContent).toContain("REVOKE ALL ON FUNCTION public.complete_onboarding");
    expect(migrationContent).toContain("FROM PUBLIC");
    expect(migrationContent).toContain("FROM anon");
    expect(migrationContent).toContain("GRANT EXECUTE ON FUNCTION public.complete_onboarding");
    expect(migrationContent).toContain("TO authenticated");
  });

  it("derives user identity exclusively from auth.uid()", () => {
    expect(migrationContent).toContain("v_user_id := auth.uid();");
    expect(migrationContent).toContain("IF v_user_id IS NULL THEN");
    expect(migrationContent).toContain("RAISE EXCEPTION 'Not authenticated'");
  });

  it("locks user profile row FOR UPDATE", () => {
    expect(migrationContent).toContain(
      "PERFORM 1 FROM public.profiles WHERE id = v_user_id FOR UPDATE;"
    );
  });

  it("atomically deactivates previous active exams and inserts new active exam", () => {
    expect(migrationContent).toContain("UPDATE public.exams");
    expect(migrationContent).toContain("SET is_active = false");
    expect(migrationContent).toContain("INSERT INTO public.exams");
    expect(migrationContent).toContain("is_active");
  });

  it("updates profile onboarding_completed to true and creates initial daily_goals row", () => {
    expect(migrationContent).toContain("onboarding_completed = true");
    expect(migrationContent).toContain("INSERT INTO public.daily_goals");
  });
});
