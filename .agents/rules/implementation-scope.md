# Implementation Scope & Operational Boundaries

1. **Strict Scope Adherence**:
   - Implement only feature tickets explicitly requested by the user. Do not jump ahead to future tickets or epics without authorization.
   - Do not add features outside the Product Requirements Document (e.g., social feeds, leaderboards, payments, live chat are out of scope for v1).

2. **Core MVP Scoping Constraints**:
   - **One Active Exam Profile & One Active Book**: A user can upload multiple books, but only one active book powers the "Continue Practice" main loop.
   - **Upload Constraints**: PDF, DOCX, TXT only; 50 MB file size limit; password-protected files rejected; scanned PDFs flagged with clear user message rather than failed OCR.
   - **Background Tasks**: All async jobs run via Inngest and must be idempotent and safe to retry.

3. **Required Prior User Approvals**:
   - Explicit user approval is required before:
     - Executing database migrations outside the local test database.
     - Performing destructive actions (dropping tables, deleting buckets, bulk file deletion).
     - Deploying to staging or production environments.
     - Setting up or connecting paid external third-party accounts or APIs.
