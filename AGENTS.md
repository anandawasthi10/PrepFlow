# PrepFlow — Agent Implementation Rules & Guardrails

This document establishes permanent operating rules, constraints, and architecture guardrails for all AI agents working on the PrepFlow codebase.

---

## 1. Non-Negotiable Security & Credential Rules

1. **Zero Secret Leakage**:
   - Never print, reveal, log, commit, send in chat, or expose values from `.env.local` or environment files.
   - Server-side runtime code may access required environment variables through the environment configuration.
   - Browser/client code may access only variables explicitly prefixed with `NEXT_PUBLIC_`.
   - Never include secrets in test fixtures, screenshots, example files, or error messages.
   - Document required variables using `.env.example` with variable names and descriptive placeholder comments only.
2. **Server-Only Secrets & Client Isolation**:
   - Supabase `SUPABASE_SECRET_KEY`, OpenAI `OPENAI_API_KEY`, Inngest signing keys, Upstash Redis tokens, and Sentry auth tokens must **never** be imported into or accessible by client/browser code. Server-only modules must enforce `import "server-only"`.
   - Browser/client code accesses public configuration only via `NEXT_PUBLIC_` variables (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
   - Use `@supabase/ssr`; never use deprecated `@supabase/auth-helpers-nextjs`.
   - When authentication and cookie proxy adapters are implemented, server and middleware clients must use only `cookies.getAll()` and `cookies.setAll()`.
3. **Data Ownership & Row-Level Security (RLS)**:
   - Every public table storing user data must have RLS enabled with the predicate `user_id = auth.uid()`.
   - Every API endpoint and Server Action must verify the authenticated user session and validate resource ownership before executing queries or mutations.
4. **Private Storage & Short-Lived Access**:
   - The Supabase `books` storage bucket is strictly private (no public access).
   - All object paths must be user-scoped: `books/{auth.uid()}/{book_id}/...`.
   - File downloads or previews must always use short-lived signed URLs.
5. **Answer-Key Shielding**:
   - When serving practice questions (`/api/practice/next`), `correct_option` and `explanation` **must never be transmitted** to the browser.
   - Scoring is executed strictly on the server against the database record.

---

## 2. Core Practice & AI Generation Guardrails

1. **Question Bank Order & Deterministic Scoring**:
   - Extracted question banks must be stored and served in exact source sequential order ($Q_1 \rightarrow Q_2 \rightarrow Q_3 \dots$).
   - The stored book answer key is the **sole authority** for grading question bank questions. AI models must **never** decide correctness for extracted question bank items.
2. **Theory Question Generation (Create-Once Persistence)**:
   - Theory questions must be generated on demand from retrieved book source passages.
   - Generated questions must strictly adhere to the Zod schema: exactly 4 unique options (A–D), exactly 1 correct key, source citation, and explanation.
   - A generated question **must be saved to the database before display** and assigned a sequential position.
   - A question is **never regenerated differently** for the same sequence position.
3. **Scope Constraints**:
   - Version 1 supports **one active exam profile** and **one active book** at a time per user for the core "Continue Practice" loop.

---

## 3. Engineering & Validation Standards

1. **Runtime Type Safety & Validation**:
   - Use TypeScript in strict mode across the entire codebase.
   - Every API request body, query parameter, and AI structured response must be validated using **Zod**.
2. **Client State Architecture**:
   - Use **TanStack Query** for server-state fetching, cache invalidation, mutations, and optimistic UI updates where needed.
   - Use standard React `useState` / `useReducer` for local component and UI state.
   - Do **not** introduce Zustand, Redux, MobX, or any external global client-state library in MVP unless explicitly requested.
3. **Background Jobs (Inngest)**:
   - All asynchronous workflows (document parsing, classification, question-bank extraction, theory vector store indexing, retries, cascading deletions) must run through **Inngest**.
   - Step functions must be idempotent and safe to retry automatically.
4. **Rate Limiting**:
   - Implement rate limiting with an abstraction layer backed by Upstash Redis.
   - Ensure the rate limiter can be cleanly mocked or bypassed in local development and automated tests.
5. **Step-by-Step Verification**:
   - After completing each feature ticket, run and verify:
     1. TypeScript compiler checks (`tsc --noEmit` or `npm run type-check`).
     2. ESLint / code formatting checks.
     3. Unit / integration tests relevant to the changed modules.

---

## 4. Operational Boundaries & Explicit User Approvals

You must **request explicit user confirmation** before performing any of the following:
- Executing database migrations outside local test databases.
- Performing destructive data actions (dropping tables, deleting buckets, bulk file removal).
- Triggering production or staging deployments.
- Setting up paid third-party services or configuring live external accounts (Inngest Cloud, Upstash, OpenAI, Supabase Production).
- Selecting specific OpenAI models (propose current options and cost/quality tradeoffs for approval at the theory-AI milestone).
- Implementing feature tickets or architectural changes outside the scope explicitly requested by the user.
