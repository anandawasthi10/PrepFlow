# PrepFlow — Project Context & System Rules

This document synthesizes the non-negotiable product, architecture, security, frontend, and data rules for **PrepFlow**, established across the official project specifications:
- `01_Product_Requirements_Document.pdf`
- `02_Technical_Architecture_Document.pdf`
- `03_Security_and_Access_Document.pdf`
- `04_Frontend_Specification_Document.pdf`
- `05_Feature_Ticket_List.pdf`
- Fixed MVP Architecture Decisions (approved 2026-10-05)

---

## 1. Product Vision & Core Workflow

PrepFlow is a hybrid AI-powered exam practice, revision, and progress-tracking web application designed for competitive, entrance, board, and certification exam aspirants (ages 16–35).

### Fundamental Operational Rules
1. **User Focus & Active Scope**:
   - Version 1 focuses on **one active exam profile** and **one active book** at a time per user.
   - Users may upload multiple books, but exactly one active book powers the "Continue Practice" primary loop.
2. **Sequential Question Bank Mode (Numbered MCQs with Answer Key)**:
   - Preserves exact source question order ($Q_1 \rightarrow Q_2 \rightarrow Q_3 \dots$).
   - Practice always continues from the next unanswered sequential question in stored source order.
   - **Deterministic Scoring**: The stored book answer key decides correctness, **never an AI model**.
3. **Theory AI Practice Mode (Textbooks, Notes, Paragraphs)**:
   - Theory files are stored privately and indexed for retrieval.
   - Generates **one source-grounded MCQ on demand** using strict schema constraints.
   - **Create-Once Persistence**: The question, options (A–D), correct answer, explanation, source reference, and sequence number **must be saved to the database before display**.
   - A generated question is **never regenerated** or altered differently for the same sequence position.
4. **Mixed-Book Practice Mode**:
   - Uses extracted chapter-end MCQs in original order.
   - Generates supplementary persistent AI questions only from theory sections.
5. **Revision Queue Mode (Spaced Repetition)**:
   - Resurfaces incorrect, skipped, or user-flagged "unsure" items at spaced intervals (**1, 3, 7, 14, 30 days**).
   - Operates independently without corrupting or advancing primary sequential practice.
6. **Topic Practice Mode**:
   - Serves unused extracted questions or generates grounded practice filtered by chapter/subject.

---

## 2. Technical Architecture & Technology Stack

| Layer | Standard / Technology | Notes & Constraints |
| :--- | :--- | :--- |
| **Runtime & Language** | TypeScript (Strict Mode) | Full type-safety across frontend and backend |
| **Framework** | Next.js (App Router) + React | Single codebase for UI, Server Components, and API Routes |
| **Styling** | Tailwind CSS + shadcn/ui | Accessible, consistent component design system |
| **Database** | Supabase PostgreSQL | Relational schema with strict Row-Level Security (RLS) |
| **Authentication** | Supabase Auth | Email/password, email verification, password reset, HTTP-only sessions |
| **File Storage** | Supabase Storage | Private `books` bucket with user-scoped folders & signed URLs |
| **AI Generation** | OpenAI Responses API | Structured Outputs / JSON Schema-constrained generation |
| **Retrieval / RAG** | OpenAI Vector Stores / File Search | Semantic retrieval over uploaded theory books |
| **Background Jobs** | **Inngest** | Idempotent, safe-to-retry async extraction, classification, indexing, and cleanup |
| **Rate Limiting** | **Upstash Redis** | Server-side abstraction, mockable in dev/testing; protects auth, uploads, AI generation, and submissions |
| **State Management** | TanStack Query + React hooks | Server-state caching & mutations; useState/useReducer for local UI (no global store) |
| **Validation** | Zod | Runtime validation on all API inputs and AI structured outputs |
| **Charts & Visuals** | Recharts | Responsive, accessible accuracy and volume metrics |
| **Error Monitoring** | Sentry | Error tracking with sanitized user context |
| **Hosting** | Vercel + Supabase | Separate Development, Staging, and Production environments |

---

## 3. Core Database Schema & Relational Structure

- `profiles`: `id`, `full_name`, `role`, `timezone`, `onboarding_completed`, `created_at`
- `exams`: `id`, `user_id`, `name`, `exam_date`, `daily_question_goal`, `is_active`
- `books`: `id`, `user_id`, `title`, `storage_path`, `document_type` (`question_bank` | `theory` | `mixed`), `processing_status` (`uploading` | `processing` | `ready` | `failed`), `vector_store_id`, `file_size_bytes`, `page_count`
- `book_sections`: `id`, `book_id`, `sequence_order`, `title`, `section_type`, `subject`, `chapter`, `page_range`
- `questions`: `id`, `book_id`, `source_type` (`extracted` | `ai_generated`), `sequence_no`, `text`, `options` (A–D JSON), `correct_option`, `explanation`, `source_refs`
- `practice_sessions`: `id`, `user_id`, `exam_id`, `book_id`, `mode` (`sequential` | `theory` | `revision` | `topic`), `start_time`, `end_time`, `counters`
- `question_attempts`: `id`, `user_id`, `question_id`, `session_id`, `mode`, `selected_option`, `result` (`correct` | `incorrect` | `skipped` | `unsure`), `time_spent_seconds`, `attempted_at`
- `daily_goals`: `id`, `user_id`, `exam_id`, `local_date`, `target`, `completed`, `is_completed`
- `revision_queue`: `id`, `user_id`, `question_id`, `due_at`, `interval_days`, `review_count`, `status` (`due` | `reviewed` | `mastered`)
- `book_processing_jobs`: `id`, `book_id`, `type`, `status`, `retry_count`, `safe_error_message`, `created_at`
- `audit_logs`: `id`, `actor_id`, `event_type`, `resource`, `safe_metadata`, `timestamp`

### Relational Integrity Rules
- `profiles` $1 \rightarrow N$ `exams`, `books`, `daily_goals`
- `books` $1 \rightarrow N$ `book_sections`, `questions`
- `practice_sessions` $1 \rightarrow N$ `question_attempts`
- `questions` $1 \rightarrow N$ `question_attempts`, `revision_queue`
- **Transactional Consistency**: Answer submissions must update `question_attempts`, `daily_goals`, and `revision_queue` within a single atomic database transaction / RPC.

---

## 4. Security & Data Protection Rules

1. **Answer-Key Protection (Critical)**:
   - When serving questions (`/api/practice/next`), `correct_option` and `explanation` **must never be transmitted** to the browser.
   - Scoring happens strictly server-side by comparing the user submission against the stored database answer key.
   - Correct answer, explanation, and source citations are revealed only after submission.
2. **Row-Level Security (RLS)**:
   - Enabled on all public tables.
   - Strict ownership predicate: `user_id = auth.uid()`.
   - Questions are readable only if associated with a `ready` book owned by the authenticated user.
3. **Storage Isolation**:
   - Bucket `books` is strictly private (no public URLs).
   - User path convention: `books/{auth.uid()}/{book_id}/original.pdf`.
   - Client downloads use short-lived signed URLs.
4. **Administrative Access Principle**:
   - Administrators cannot view user study content or private study logs by default.
   - Support access requires explicit user consent, time limits, least-privilege scoping, and immutable audit logging.
5. **Reauthentication Requirements**:
   - Reauthentication is mandatory prior to book deletion, account deletion, or full data export.
6. **Deletion Lifecycle**:
   - Deletion triggers a cascading Inngest cleanup job: Supabase storage file, vector store index / files at OpenAI, database records, and revision items.

---

## 5. File Upload & Processing Specifications

- **Accepted Formats**: PDF, DOCX, and TXT only.
- **Maximum File Size**: **50 MB** per file.
- **Security & Integrity Checks**:
  - MIME type and file extension verification on the server.
  - Reject password-protected/encrypted files immediately with clear feedback.
  - Record file size (`file_size_bytes`) and page count (`page_count`) in metadata.
  - Scanned / image-only PDFs: Detect unreadable/scanned content and present a clear user-facing warning rather than failing silently or producing corrupted extractions.

---

## 6. Frontend & UI/UX Specifications

### Brand & Visual Identity
- **Personality**: Calm, focused, academic, trustworthy, minimal distraction.
- **Color Tokens**:
  - Primary: `#1D4ED8` (700 - primary buttons, active nav), `#2563EB` (600 - hover), `#DBEAFE` (100 - selection)
  - Secondary: `#0F766E` (700)
  - Success: `#15803D` (700), `#DCFCE7` (100)
  - Warning: `#B45309` (700), `#FEF3C7` (100)
  - Error: `#B91C1C` (700), `#FEE2E2` (100)
  - Neutrals: `#0F172A` (Slate 950 - headings), `#334155` (Slate 700 - body), `#F8FAFC` (Slate 50 - background), `#FFFFFF` (White - cards)
- **Typography**: Inter (primary), system fallbacks. Noto Sans / Noto Sans Devanagari for Hindi support. Mobile question font $\ge 16\text{px}$.
- **Layout & Spacing**: 4px scale (4, 8, 12, 16, 20, 24, 32, 40, 48 px). Max practice content width: `760px`. Minimum touch target: `44x44px`.

### Navigation
- **Mobile**: Fixed bottom navigation bar (`Home`, `Practice`, `Revision`, `Books`, `Profile`).
- **Desktop**: Left vertical sidebar (`Dashboard`, `Practice`, `Revision`, `Books`, `Analytics`, `Settings`, `Admin` [role-conditioned]).

### Accessibility (WCAG AA)
- Never rely exclusively on color to convey state (use badges, icons, and text labels).
- Full keyboard operability for A–D options, navigation, modals, and submission.
- Visible focus rings and clear helper/error text.
- Text summaries provided alongside all Recharts analytics.
