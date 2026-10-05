# PrepFlow — Implementation Roadmap

This roadmap organizes the 42 feature tickets from `05_Feature_Ticket_List.pdf` into structured implementation phases, incorporating all fixed architectural decisions (Inngest, Upstash Redis abstraction, 50 MB upload limits, single active book scope). 

Every ticket retains its original identifier, priority (`Must-have` vs `Should-have`), dependencies, and acceptance criteria. **Every ticket must pass TypeScript type checks, ESLint, and automated tests before completion.**

---

## Phase 1: Foundation, Data Layer, Design System & Auth
*Focus: Project scaffolding, Supabase clients & schema, RLS policies, private storage, base UI design tokens, authentication, and onboarding.*

### Tickets
- **[PF-001] Initialize application** — `Must-have`
  - **Description**: Create Next.js + TypeScript + Tailwind project, strict type checking, clean folder structure, ESLint/Prettier configuration, `.env.example` with variable names only.
  - **Dependencies**: None
  - **Acceptance Criteria**: App runs locally; lint/type checks pass; no real secrets committed.
- **[PF-002] Configure Supabase** — `Must-have`
  - **Description**: Connect Auth, PostgreSQL, and Storage with distinct browser and server clients (`@supabase/ssr`).
  - **Dependencies**: `PF-001`
  - **Acceptance Criteria**: Secrets stay server-only; missing environment variables fail gracefully with explicit errors.
- **[PF-003] Create schema/migrations** — `Must-have`
  - **Description**: Create relational tables: `profiles`, `exams`, `books` (with `file_size_bytes`, `page_count`), `book_sections`, `questions`, `practice_sessions`, `question_attempts`, `daily_goals`, `revision_queue`, `book_processing_jobs`, `audit_logs`.
  - **Dependencies**: `PF-002`
  - **Acceptance Criteria**: Foreign keys, enums, indexes, cascade constraints, and clean migration rollouts pass.
- **[PF-004] Enable RLS policies** — `Must-have`
  - **Description**: Apply user ownership policies (`user_id = auth.uid()`) across all public user-data tables.
  - **Dependencies**: `PF-003`
  - **Acceptance Criteria**: Cross-user read and write attempts are strictly rejected in automated tests.
- **[PF-005] Private storage bucket** — `Must-have`
  - **Description**: Create user-scoped private `books` storage bucket and security policies (`books/{user_id}/{book_id}/...`).
  - **Dependencies**: `PF-002`
  - **Acceptance Criteria**: No public URLs permitted; owner-only access; authenticated signed download URLs.
- **[PF-006] Design-system foundation** — `Must-have`
  - **Description**: Implement color tokens, typography (Inter), buttons, inputs, option cards, badges, modals, and error/empty states.
  - **Dependencies**: `PF-001`
  - **Acceptance Criteria**: Accessible (WCAG AA), responsive components with visible focus rings and consistent styling.
- **[PF-007] Signup and verification** — `Must-have`
  - **Description**: Email/password registration flow with email verification and profile creation trigger.
  - **Dependencies**: `PF-002`, `PF-003`, `PF-004`, `PF-006`
  - **Acceptance Criteria**: Profile created safely in DB; unverified login blocked if configured.
- **[PF-008] Login/reset/logout** — `Must-have`
  - **Description**: Secure login, password reset request/update, logout, and protected route middleware.
  - **Dependencies**: `PF-007`
  - **Acceptance Criteria**: Safe error messages, correct redirects, and rate-limited auth endpoints.
- **[PF-009] Onboarding** — `Must-have`
  - **Description**: First-time user setup collecting target exam name, exam date, user timezone, and daily question goal for the single active exam profile.
  - **Dependencies**: `PF-007`
  - **Acceptance Criteria**: Validates positive integer targets; saves onboarding completion flag to user profile.
- **[PF-010] Secure book upload** — `Must-have`
  - **Description**: Handle client-side file selection (PDF, DOCX, TXT $\le 50\text{ MB}$), validation, upload to private storage, and create book/job record.
  - **Dependencies**: `PF-005`, `PF-009`
  - **Acceptance Criteria**: File size $\le 50\text{ MB}$, MIME/extension validation, upload progress UI, user authorization statement, server-generated paths.

---

## Phase 2: Document Processing, Extraction & Retrieval Indexing
*Focus: Inngest background job functions, text/OCR parsing, classification, sequential MCQ extraction, and vector store indexing.*

### Tickets
- **[PF-011] Processing job framework** — `Must-have`
  - **Description**: Set up **Inngest** job handlers for document extraction, classification, indexing, cleanup, and retries. Jobs must be idempotent and safe to retry.
  - **Dependencies**: `PF-010`
  - **Acceptance Criteria**: Durable step execution, safe errors, retries, client status polling endpoint (`/api/books/:bookId/processing-status`).
- **[PF-012] Text extraction/OCR detection** — `Must-have`
  - **Description**: Extract raw text, record page count and page boundaries, reject encrypted/password-protected files, and detect unreadable/scanned content with clear user warnings.
  - **Dependencies**: `PF-011`
  - **Acceptance Criteria**: Page boundaries recorded; protected files rejected; scanned-content warning generated.
- **[PF-013] Document classifier** — `Must-have`
  - **Description**: Analyze extracted text to classify document as `question_bank`, `theory`, or `mixed`.
  - **Dependencies**: `PF-012`
  - **Acceptance Criteria**: Confidence score stored; fallback to user confirmation if classification is uncertain.
- **[PF-014] Question-bank extraction** — `Must-have`
  - **Description**: Parse numbered MCQs, 4 options (A–D), answer keys, explanations, and source page numbers in exact book order.
  - **Dependencies**: `PF-012`, `PF-013`
  - **Acceptance Criteria**: Missing/invalid fields flagged; exact sequential order preserved; Zod schema validation.
- **[PF-015] Question review screen** — `Should-have`
  - **Description**: Dedicated interface enabling users to review, edit, or approve flagged/ambiguous extracted questions.
  - **Dependencies**: `PF-014`
  - **Acceptance Criteria**: Approved items activated for practice; edits audited; rejected items hidden.
- **[PF-016] Theory retrieval indexing** — `Must-have`
  - **Description**: Create OpenAI Vector Store and upload theory content chunks for semantic search.
  - **Dependencies**: `PF-012`, `PF-013`
  - **Acceptance Criteria**: Book moves to `ready` status only after successful index creation; vector store ID stored; isolated by user.
- **[PF-017] Mixed section mapping** — `Should-have`
  - **Description**: Map chapters/sections in mixed books to classify individual segments as theory vs question bank.
  - **Dependencies**: `PF-014`, `PF-016`
  - **Acceptance Criteria**: Sections linked to page ranges and questions; user can review and adjust boundaries.

---

## Phase 3: Practice Engine & Secure Scoring Loop
*Focus: Session state machine, sequential delivery, create-once AI generation, mobile practice UI, server-side scoring, and attempt tracking.*

### Tickets
- **[PF-018] Practice-session lifecycle** — `Must-have`
  - **Description**: Manage start, resume, pause, and completion of practice sessions for the single active book across primary, revision, and topic modes.
  - **Dependencies**: `PF-003`, `PF-004`, `PF-007`
  - **Acceptance Criteria**: User-scoped session records; persistent counters and elapsed timers.
- **[PF-019] Next extracted question** — `Must-have`
  - **Description**: Endpoint to fetch the earliest unanswered sequential question for the active question bank in exact source order.
  - **Dependencies**: `PF-014`, `PF-018`
  - **Acceptance Criteria**: Answer key stripped prior to response; handles end-of-bank completion; verifies book ownership.
- **[PF-020] Theory question generation** — `Must-have`
  - **Description**: Retrieve source passage from vector store, generate one valid MCQ with OpenAI Structured Outputs, validate and persist before display. Never regenerate differently for the same sequence position.
  - **Dependencies**: `PF-016`, `PF-018`
  - **Acceptance Criteria**: Exactly 4 unique options (A–D), valid answer key, source citation; duplicate check; saved to DB before client delivery.
- **[PF-021] Practice question UI** — `Must-have`
  - **Description**: Mobile-first practice layout with question header, progress indicator, A–D option cards, stopwatch timer, "Unsure" toggle, and submit button.
  - **Dependencies**: `PF-006`, `PF-018`, `PF-019`
  - **Acceptance Criteria**: Keyboard navigation (keys 1–4 or A–D, Enter), 44px touch targets, max-width 760px, responsive design.
- **[PF-022] Secure answer scoring** — `Must-have`
  - **Description**: Server route to score submitted answer against stored DB key (never AI scoring for extracted banks), record attempt, update daily progress, and queue revision if wrong.
  - **Dependencies**: `PF-021`, `PF-003`, `PF-004`
  - **Acceptance Criteria**: Idempotent submission; scoring logic completely server-side; atomic database transaction/RPC.
- **[PF-023] Post-answer feedback** — `Must-have`
  - **Description**: Render instant feedback card: correct/incorrect state, highlighted correct option, explanation, source citation, and "Next Question" CTA.
  - **Dependencies**: `PF-022`
  - **Acceptance Criteria**: High-contrast, non-color-only state indicators (WCAG AA), calm supportive tone.
- **[PF-024] Skip/unsure handling** — `Must-have`
  - **Description**: Support skipping questions or submitting with "unsure" flag without breaking primary sequential order.
  - **Dependencies**: `PF-022`
  - **Acceptance Criteria**: Explicit tracking of skip vs unsure; automatic scheduling of unsure items into revision queue.

---

## Phase 4: Daily Progress, Dashboard & Spaced Revision Engine
*Focus: Timezone-aware goal calculation, dashboard metrics and CTAs, spaced repetition scheduling, and streak tracking.*

### Tickets
- **[PF-025] Daily goals/timezone tracking** — `Must-have`
  - **Description**: Compute "today" and "yesterday" answer counts and goal completion relative to the user's configured IANA timezone.
  - **Dependencies**: `PF-022`, `PF-009`
  - **Acceptance Criteria**: Accurately handles midnight transitions and daylight saving changes; tests verify timezone calculations.
- **[PF-026] Dashboard overview** — `Must-have`
  - **Description**: Main dashboard displaying daily target progress, yesterday's recap, "Continue Practice" primary CTA (targeting active book), revision counter, accuracy metric, and active book status.
  - **Dependencies**: `PF-025`, `PF-019`, `PF-020`, `PF-023`
  - **Acceptance Criteria**: Live reactive updates after session completion; empty states for newly registered users.
- **[PF-027] Revision scheduler** — `Must-have`
  - **Description**: Schedule incorrect, skipped, and unsure questions into `revision_queue` using spaced intervals (1, 3, 7, 14, 30 days).
  - **Dependencies**: `PF-022`
  - **Acceptance Criteria**: Deduplication (no duplicate active queue entries for the same question); mastery flag on repeated success.
- **[PF-028] Revision practice** — `Must-have`
  - **Description**: Practice session mode specifically for due revision items using identical practice interface and scoring rules.
  - **Dependencies**: `PF-027`, `PF-021`, `PF-022`
  - **Acceptance Criteria**: Practice due items in order of urgency; does not mutate primary sequential book progress pointer.
- **[PF-029] Streaks** — `Should-have`
  - **Description**: Track consecutive active practice days and goal-achieved streaks.
  - **Dependencies**: `PF-025`
  - **Acceptance Criteria**: Respects user timezone; correct streak preservation and rest-day gap handling.

---

## Phase 5: Analytics, Book Management & Data Lifecycle
*Focus: Performance insights with Recharts, book library management, data export, and complete data deletion cascade via Inngest.*

### Tickets
- **[PF-030] Analytics calculations** — `Must-have`
  - **Description**: Server aggregations for volume over time, overall and chapter-level accuracy, completion velocity, and revision success rates.
  - **Dependencies**: `PF-022`, `PF-025`, `PF-027`
  - **Acceptance Criteria**: Efficient indexed queries; mathematically verified metric definitions.
- **[PF-031] Analytics UI** — `Must-have`
  - **Description**: Analytics dashboard with Recharts visualizations (bar charts for daily volume, accuracy trends, topic breakdowns).
  - **Dependencies**: `PF-030`, `PF-006`
  - **Acceptance Criteria**: Accompanying plain-text summaries for screen readers; responsive layout; date range filters.
- **[PF-032] Book management** — `Must-have`
  - **Description**: Book library interface: list uploaded books, set the single active book, inspect extraction stats, retry failed jobs, and trigger deletion.
  - **Dependencies**: `PF-010`, `PF-011`, `PF-016`
  - **Acceptance Criteria**: Owner-only access; clean state updates when active book changes.
- **[PF-033] Data export** — `Should-have`
  - **Description**: Generate and download secure CSV exports of user practice attempts, daily progress, and revision logs.
  - **Dependencies**: `PF-030`, `PF-004`
  - **Acceptance Criteria**: Authenticated and rate-limited; exports strictly user-owned data; audited in `audit_logs`.
- **[PF-038] Deletion lifecycle** — `Must-have`
  - **Description**: End-to-end deletion orchestration via Inngest: remove Supabase Storage files, database records, OpenAI Vector Stores, and attempt logs upon book or account deletion.
  - **Dependencies**: `PF-005`, `PF-011`, `PF-016`, `PF-035`
  - **Acceptance Criteria**: Immediate soft-hide with background hard deletion; reauthentication prompt before account/book wipe.

---

## Phase 6: System Hardening, Operations, Testing & Production Deployment
*Focus: Upstash rate limiting abstraction, audit logs, admin observability, automated unit/integration/E2E test suites, accessibility audits, and CI/CD deployment.*

### Tickets
- **[PF-034] Rate limiting** — `Must-have`
  - **Description**: Server-side rate limiting abstraction backed by Upstash Redis (mockable in dev/test) protecting auth routes, uploads, AI generation, hints, and submissions.
  - **Dependencies**: `PF-008`, `PF-010`, `PF-020`
  - **Acceptance Criteria**: Returns `429 Too Many Requests` with user-friendly retry-after indicators; secure failure logs.
- **[PF-035] Audit logging** — `Must-have`
  - **Description**: Structured audit logging system capturing book uploads, deletions, data exports, and admin actions.
  - **Dependencies**: `PF-003`, `PF-004`
  - **Acceptance Criteria**: Append-only audit table; zero raw secrets or sensitive question text logged.
- **[PF-036] Error monitoring** — `Must-have`
  - **Description**: Sentry integration on frontend and backend routes with custom error boundaries.
  - **Dependencies**: `PF-001`, `PF-011`
  - **Acceptance Criteria**: PII stripped from breadcrumbs; user-friendly fallback error UI with retry action.
- **[PF-037] Admin operations dashboard** — `Should-have`
  - **Description**: Administrator portal displaying Inngest job health, queue latency, and aggregate usage metrics.
  - **Dependencies**: `PF-004`, `PF-011`, `PF-035`
  - **Acceptance Criteria**: Strictly restricted to `role = 'admin'`; no access to private study content or attempt history without explicit user consent.
- **[PF-039] Core unit/integration tests** — `Must-have`
  - **Description**: Test suite covering sequential ordering, server scoring logic, duplicate prevention in theory generation, revision intervals, and RLS isolation.
  - **Dependencies**: `PF-019`, `PF-020`, `PF-022`, `PF-027`
  - **Acceptance Criteria**: 100% pass rate in CI; explicit negative test cases for cross-user data access.
- **[PF-040] End-to-end tests** — `Must-have`
  - **Description**: Playwright/Cypress E2E test suite covering full user journey (Signup $\rightarrow$ Onboarding $\rightarrow$ Upload $\rightarrow$ Practice $\rightarrow$ Feedback $\rightarrow$ Dashboard $\rightarrow$ Revision).
  - **Dependencies**: `PF-039`, `PF-026`, `PF-028`
  - **Acceptance Criteria**: Headless execution in CI on mobile and desktop viewport sizes.
- **[PF-041] Accessibility/responsive audit** — `Must-have`
  - **Description**: Automated and manual WCAG AA compliance audit (keyboard trap checks, color contrast, aria labels, screen reader flows, 320px viewport test).
  - **Dependencies**: `PF-006`, `PF-021`, `PF-026`, `PF-031`
  - **Acceptance Criteria**: Zero critical axe-core violations; usable on small mobile displays.
- **[PF-042] Deploy staging/production** — `Must-have`
  - **Description**: Configure Vercel hosting, separate staging/production Supabase projects, automated migrations, health check endpoint (`/api/health`), and rollback documentation.
  - **Dependencies**: `PF-036`, `PF-039`, `PF-040`
  - **Acceptance Criteria**: Staging and Production fully separated; zero client-side leak of service keys.
