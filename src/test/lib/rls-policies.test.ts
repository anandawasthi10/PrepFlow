import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Row-Level Security (RLS) Policies Migration (PF-004)", () => {
  const rlsMigrationPath = path.resolve(
    __dirname,
    "../../../supabase/migrations/20261006000001_enable_rls_policies.sql"
  );

  it("verifies RLS migration SQL file exists and enables RLS on all 11 tables", () => {
    expect(fs.existsSync(rlsMigrationPath)).toBe(true);
    const sql = fs.readFileSync(rlsMigrationPath, "utf-8");

    const expectedTables = [
      "profiles",
      "exams",
      "books",
      "book_sections",
      "questions",
      "practice_sessions",
      "question_attempts",
      "daily_goals",
      "revision_queue",
      "book_processing_jobs",
      "audit_logs",
    ];

    expectedTables.forEach((table) => {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);
    });
  });

  it("verifies direct ownership policies use auth.uid() = user_id or auth.uid() = id", () => {
    const sql = fs.readFileSync(rlsMigrationPath, "utf-8");

    expect(sql).toContain('CREATE POLICY "profiles_select_own"');
    expect(sql).toContain('CREATE POLICY "exams_select_own"');
    expect(sql).toContain('CREATE POLICY "books_select_own"');
    expect(sql).toContain('CREATE POLICY "practice_sessions_select_own"');
    expect(sql).toContain('CREATE POLICY "question_attempts_select_own"');
    expect(sql).toContain('CREATE POLICY "daily_goals_select_own"');
    expect(sql).toContain('CREATE POLICY "revision_queue_select_own"');

    expect(sql).toContain("USING (auth.uid() = id)");
    expect(sql).toContain("USING (auth.uid() = user_id)");
  });

  it("verifies child tables propagate ownership through parent book ownership checks", () => {
    const sql = fs.readFileSync(rlsMigrationPath, "utf-8");

    // book_sections
    expect(sql).toContain('CREATE POLICY "book_sections_select_own"');
    expect(sql).toContain("WHERE b.id = book_sections.book_id\n        AND b.user_id = auth.uid()");

    // questions
    expect(sql).toContain('CREATE POLICY "questions_select_own"');
    expect(sql).toContain("WHERE b.id = questions.book_id\n        AND b.user_id = auth.uid()");

    // book_processing_jobs
    expect(sql).toContain('CREATE POLICY "book_processing_jobs_select_own"');
    expect(sql).toContain(
      "WHERE b.id = book_processing_jobs.book_id\n        AND b.user_id = auth.uid()"
    );
  });

  it("verifies audit logs enforce append-only behavior with no client UPDATE/DELETE policies", () => {
    const sql = fs.readFileSync(rlsMigrationPath, "utf-8");

    expect(sql).toContain('CREATE POLICY "audit_logs_select_own"');
    expect(sql).toContain('CREATE POLICY "audit_logs_insert_own"');
    expect(sql).not.toContain('CREATE POLICY "audit_logs_update_own"');
    expect(sql).not.toContain('CREATE POLICY "audit_logs_delete_own"');
  });

  it("verifies question attempts enforce immutability with no client UPDATE policy", () => {
    const sql = fs.readFileSync(rlsMigrationPath, "utf-8");

    expect(sql).toContain('CREATE POLICY "question_attempts_select_own"');
    expect(sql).toContain('CREATE POLICY "question_attempts_insert_own"');
    expect(sql).not.toContain('CREATE POLICY "question_attempts_update_own"');
  });
});
