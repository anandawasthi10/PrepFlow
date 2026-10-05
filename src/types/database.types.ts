/**
 * PrepFlow Database Types (PF-003)
 * Strongly typed interface corresponding to supabase/migrations/20261006000000_create_core_schema.sql
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// 1. Custom Enums
export type UserRole = "user" | "admin";
export type DocumentType = "question_bank" | "theory" | "mixed" | "unknown";
export type ProcessingStatus = "uploading" | "processing" | "ready" | "failed";
export type SectionType = "theory" | "question_bank" | "mixed";
export type QuestionSourceType = "extracted" | "ai_generated";
export type McqOptionKey = "A" | "B" | "C" | "D";
export type PracticeMode = "sequential" | "theory" | "revision" | "topic";
export type AttemptResult = "correct" | "incorrect" | "skipped" | "unsure";
export type RevisionStatus = "due" | "reviewed" | "mastered";
export type JobType = "extraction" | "classification" | "indexing" | "cleanup";
export type JobStatus = "pending" | "processing" | "completed" | "failed";

// 2. Named JSONB Shape Types
export type QuestionOptionsJson = {
  A: string;
  B: string;
  C: string;
  D: string;
};

export type QuestionSourceRefsJson = {
  page?: number;
  section_id?: string;
  passage_context?: string;
  chunk_id?: string;
};

export type PracticeSessionCountersJson = {
  total: number;
  correct: number;
  incorrect: number;
  skipped: number;
  unsure: number;
};

export type AuditLogMetadataJson = Record<string, unknown>;

// 3. Database Schema Interface
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: UserRole;
          timezone: string;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role?: UserRole;
          timezone?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: UserRole;
          timezone?: string;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      exams: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          exam_date: string | null;
          daily_question_goal: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          exam_date?: string | null;
          daily_question_goal?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          exam_date?: string | null;
          daily_question_goal?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      books: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          storage_path: string;
          document_type: DocumentType;
          processing_status: ProcessingStatus;
          vector_store_id: string | null;
          file_size_bytes: number | null;
          page_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          storage_path: string;
          document_type?: DocumentType;
          processing_status?: ProcessingStatus;
          vector_store_id?: string | null;
          file_size_bytes?: number | null;
          page_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          storage_path?: string;
          document_type?: DocumentType;
          processing_status?: ProcessingStatus;
          vector_store_id?: string | null;
          file_size_bytes?: number | null;
          page_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      book_sections: {
        Row: {
          id: string;
          book_id: string;
          sequence_order: number;
          title: string;
          section_type: SectionType;
          subject: string | null;
          chapter: string | null;
          start_page: number | null;
          end_page: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          sequence_order: number;
          title: string;
          section_type?: SectionType;
          subject?: string | null;
          chapter?: string | null;
          start_page?: number | null;
          end_page?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          sequence_order?: number;
          title?: string;
          section_type?: SectionType;
          subject?: string | null;
          chapter?: string | null;
          start_page?: number | null;
          end_page?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          book_id: string;
          source_type: QuestionSourceType;
          sequence_no: number;
          text: string;
          options: QuestionOptionsJson;
          correct_option: McqOptionKey;
          explanation: string | null;
          source_refs: QuestionSourceRefsJson | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          source_type: QuestionSourceType;
          sequence_no: number;
          text: string;
          options: QuestionOptionsJson;
          correct_option: McqOptionKey;
          explanation?: string | null;
          source_refs?: QuestionSourceRefsJson | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          source_type?: QuestionSourceType;
          sequence_no?: number;
          text?: string;
          options?: QuestionOptionsJson;
          correct_option?: McqOptionKey;
          explanation?: string | null;
          source_refs?: QuestionSourceRefsJson | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      practice_sessions: {
        Row: {
          id: string;
          user_id: string;
          exam_id: string;
          book_id: string;
          mode: PracticeMode;
          start_time: string;
          end_time: string | null;
          counters: PracticeSessionCountersJson;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_id: string;
          book_id: string;
          mode: PracticeMode;
          start_time?: string;
          end_time?: string | null;
          counters?: PracticeSessionCountersJson;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exam_id?: string;
          book_id?: string;
          mode?: PracticeMode;
          start_time?: string;
          end_time?: string | null;
          counters?: PracticeSessionCountersJson;
          created_at?: string;
          updated_at?: string;
        };
      };
      question_attempts: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          session_id: string | null;
          mode: PracticeMode;
          selected_option: McqOptionKey | null;
          result: AttemptResult;
          time_spent_seconds: number;
          attempted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          session_id?: string | null;
          mode: PracticeMode;
          selected_option?: McqOptionKey | null;
          result: AttemptResult;
          time_spent_seconds?: number;
          attempted_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          session_id?: string | null;
          mode?: PracticeMode;
          selected_option?: McqOptionKey | null;
          result?: AttemptResult;
          time_spent_seconds?: number;
          attempted_at?: string;
        };
      };
      daily_goals: {
        Row: {
          id: string;
          user_id: string;
          exam_id: string;
          local_date: string;
          target: number;
          completed: number;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_id: string;
          local_date: string;
          target: number;
          completed?: number;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exam_id?: string;
          local_date?: string;
          target?: number;
          completed?: number;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      revision_queue: {
        Row: {
          id: string;
          user_id: string;
          question_id: string;
          due_at: string;
          interval_days: number;
          review_count: number;
          status: RevisionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          due_at: string;
          interval_days?: number;
          review_count?: number;
          status?: RevisionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question_id?: string;
          due_at?: string;
          interval_days?: number;
          review_count?: number;
          status?: RevisionStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      book_processing_jobs: {
        Row: {
          id: string;
          book_id: string;
          type: JobType;
          status: JobStatus;
          retry_count: number;
          safe_error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_id: string;
          type: JobType;
          status?: JobStatus;
          retry_count?: number;
          safe_error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          book_id?: string;
          type?: JobType;
          status?: JobStatus;
          retry_count?: number;
          safe_error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          event_type: string;
          resource: string;
          safe_metadata: AuditLogMetadataJson;
          timestamp: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          event_type: string;
          resource: string;
          safe_metadata?: AuditLogMetadataJson;
          timestamp?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          event_type?: string;
          resource?: string;
          safe_metadata?: AuditLogMetadataJson;
          timestamp?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      document_type: DocumentType;
      processing_status: ProcessingStatus;
      section_type: SectionType;
      question_source_type: QuestionSourceType;
      mcq_option_key: McqOptionKey;
      practice_mode: PracticeMode;
      attempt_result: AttemptResult;
      revision_status: RevisionStatus;
      job_type: JobType;
      job_status: JobStatus;
    };
  };
}
