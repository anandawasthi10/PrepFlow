# PrepFlow — Architectural & Operational Decisions Log

This document tracks technical decisions for PrepFlow, recording resolved architecture standards and operational milestones requiring future approval.

---

## Part 1: Resolved Architecture Decisions

### 1. Background Job Execution Framework (PF-011) — [RESOLVED: Inngest]
- **Decision**: Standardize on **Inngest** for all asynchronous document workflows (text extraction, classification, question-bank extraction, theory vector store indexing, retries, and cascading deletion cleanup).
- **Guidelines**:
  - All Inngest step functions must be idempotent and safe to retry automatically.
  - In local development and automated testing, use Inngest's local dev server or direct test execution.
  - External Inngest Cloud accounts or credentials will not be created automatically; manual setup steps will be documented when deploying.

### 2. File Upload Constraints & Quotas (PF-010, PF-012) — [RESOLVED]
- **Decision**:
  - **Maximum File Size**: Exactly **50 MB** per uploaded document.
  - **Permitted Formats**: PDF, DOCX, and TXT only.
  - **Encryption**: Reject password-protected or encrypted files immediately with clear user feedback.
  - **Metadata**: Capture `file_size_bytes` and `page_count` upon upload.
  - **Scanned Documents**: Automatic OCR for image-only/scanned PDFs is out of scope for MVP; the parser will detect non-extractable/scanned documents and present an informative warning to the user.
  - **Active Scope**: Users may upload multiple books to their library, but exactly **one active book** and **one active exam profile** powers the core "Continue Practice" loop at a time.

### 3. Rate Limiting Architecture (PF-034) — [RESOLVED: Upstash Redis with Abstraction]
- **Decision**: Implement a server-side rate-limiting abstraction backed by **Upstash Redis**.
- **Guidelines**:
  - Wrap rate limiting in an interface (`RateLimiter`) that can be cleanly bypassed or mocked with an in-memory driver during local development and test runs.
  - Protect sensitive endpoints: login, password reset, book upload, AI question generation, hints, and answer submissions.
  - No external accounts will be provisioned automatically; environment variables will use placeholders only.

### 4. Client State Architecture (PF-021) — [RESOLVED: TanStack Query + React Hooks]
- **Decision**:
  - Use **TanStack Query** for server-state fetching, cache invalidation, mutations, and optimistic UI updates where needed.
  - Use standard React `useState` / `useReducer` for local component and UI state.
  - **Do not introduce** Zustand, Redux, MobX, or other global client-state libraries in MVP unless explicitly requested.

---

## Part 2: Deferred Milestones Requiring Explicit Approval

### 1. OpenAI Model Selection per Workload (PF-013, PF-014, PF-020) — [DEFERRED TO THEORY-AI MILESTONE]
- **Context**: The app utilizes OpenAI Structured Outputs (Responses API) and Vector Stores (File Search).
- **Rule**: Defer model selection until reaching the Phase 2/Phase 3 theory-AI implementation milestone. At that time, present current model options, cost/quality tradeoffs, and request explicit user confirmation before selecting model IDs.
