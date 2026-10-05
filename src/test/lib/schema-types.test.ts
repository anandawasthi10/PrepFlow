import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import type {
  Database,
  UserRole,
  DocumentType,
  ProcessingStatus,
  SectionType,
  QuestionSourceType,
  McqOptionKey,
  PracticeMode,
  AttemptResult,
  RevisionStatus,
  JobType,
  JobStatus,
  QuestionOptionsJson,
  QuestionSourceRefsJson,
  PracticeSessionCountersJson,
} from "@/types/database.types";

describe("Database Schema & TypeScript Types (PF-003)", () => {
  it("verifies migration SQL file exists and contains all required tables, triggers, and indexes", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../../../supabase/migrations/20261006000000_create_core_schema.sql"
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sqlContent = fs.readFileSync(migrationPath, "utf-8");

    // Enums
    expect(sqlContent).toContain("CREATE TYPE public.user_role AS ENUM ('user', 'admin');");
    expect(sqlContent).toContain("CREATE TYPE public.document_type AS ENUM");
    expect(sqlContent).toContain("CREATE TYPE public.processing_status AS ENUM");
    expect(sqlContent).toContain("CREATE TYPE public.mcq_option_key AS ENUM ('A', 'B', 'C', 'D');");
    expect(sqlContent).toContain("CREATE TYPE public.attempt_result AS ENUM");
    expect(sqlContent).toContain("CREATE TYPE public.revision_status AS ENUM");

    // Tables
    expect(sqlContent).toContain("CREATE TABLE public.profiles");
    expect(sqlContent).toContain("CREATE TABLE public.exams");
    expect(sqlContent).toContain("CREATE TABLE public.books");
    expect(sqlContent).toContain("CREATE TABLE public.book_sections");
    expect(sqlContent).toContain("CREATE TABLE public.questions");
    expect(sqlContent).toContain("CREATE TABLE public.practice_sessions");
    expect(sqlContent).toContain("CREATE TABLE public.question_attempts");
    expect(sqlContent).toContain("CREATE TABLE public.daily_goals");
    expect(sqlContent).toContain("CREATE TABLE public.revision_queue");
    expect(sqlContent).toContain("CREATE TABLE public.book_processing_jobs");
    expect(sqlContent).toContain("CREATE TABLE public.audit_logs");

    // Hardened Triggers & Functions
    expect(sqlContent).toContain("SET search_path = ''");
    expect(sqlContent).toContain("CREATE OR REPLACE FUNCTION public.handle_new_user()");
    expect(sqlContent).toContain("CREATE OR REPLACE FUNCTION public.sync_daily_goal_completion()");
    expect(sqlContent).toContain("CREATE OR REPLACE FUNCTION public.set_updated_at()");

    // Constraints & Indexes
    expect(sqlContent).toContain("CREATE UNIQUE INDEX idx_exams_user_single_active");
    expect(sqlContent).toContain("WHERE (is_active = true)");
    expect(sqlContent).toContain("uq_questions_book_sequence UNIQUE (book_id, sequence_no)");
    expect(sqlContent).toContain(
      "uq_daily_goals_user_exam_date UNIQUE (user_id, exam_id, local_date)"
    );
    expect(sqlContent).toContain("uq_revision_queue_user_question UNIQUE (user_id, question_id)");
  });

  it("validates named JSONB shape type contracts", () => {
    const validOptions: QuestionOptionsJson = {
      A: "Option A text",
      B: "Option B text",
      C: "Option C text",
      D: "Option D text",
    };
    expect(Object.keys(validOptions)).toEqual(["A", "B", "C", "D"]);

    const validSourceRefs: QuestionSourceRefsJson = {
      page: 42,
      section_id: "sec-123",
      passage_context: "Sample citation excerpt",
    };
    expect(validSourceRefs.page).toBe(42);

    const validCounters: PracticeSessionCountersJson = {
      total: 10,
      correct: 8,
      incorrect: 2,
      skipped: 0,
      unsure: 1,
    };
    expect(validCounters.total).toBe(10);
    expect(validCounters.correct).toBe(8);
  });

  it("verifies type-level completeness of all 11 tables in Database interface", () => {
    type Tables = Database["public"]["Tables"];

    // Type assignment check ensures table names exist in the schema definition
    type TableNames = keyof Tables;
    const expectedTables: TableNames[] = [
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

    expect(expectedTables).toHaveLength(11);
  });

  it("verifies enum type compatibility", () => {
    const roles: UserRole[] = ["user", "admin"];
    const docTypes: DocumentType[] = ["question_bank", "theory", "mixed", "unknown"];
    const procStatuses: ProcessingStatus[] = ["uploading", "processing", "ready", "failed"];
    const sectionTypes: SectionType[] = ["theory", "question_bank", "mixed"];
    const sourceTypes: QuestionSourceType[] = ["extracted", "ai_generated"];
    const optionKeys: McqOptionKey[] = ["A", "B", "C", "D"];
    const practiceModes: PracticeMode[] = ["sequential", "theory", "revision", "topic"];
    const attemptResults: AttemptResult[] = ["correct", "incorrect", "skipped", "unsure"];
    const revStatuses: RevisionStatus[] = ["due", "reviewed", "mastered"];
    const jobTypes: JobType[] = ["extraction", "classification", "indexing", "cleanup"];
    const jobStatuses: JobStatus[] = ["pending", "processing", "completed", "failed"];

    expect(roles).toHaveLength(2);
    expect(docTypes).toHaveLength(4);
    expect(procStatuses).toHaveLength(4);
    expect(sectionTypes).toHaveLength(3);
    expect(sourceTypes).toHaveLength(2);
    expect(optionKeys).toHaveLength(4);
    expect(practiceModes).toHaveLength(4);
    expect(attemptResults).toHaveLength(4);
    expect(revStatuses).toHaveLength(3);
    expect(jobTypes).toHaveLength(4);
    expect(jobStatuses).toHaveLength(4);
  });
});
