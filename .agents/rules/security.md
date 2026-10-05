# Security & Data Isolation Rules

1. **Credential & Secret Protection**:
   - Never print, reveal, log, commit, send in chat, or expose values from `.env.local` or environment files.
   - Server-side runtime code may access required environment variables through the environment configuration.
   - Browser/client code may access only variables explicitly prefixed with `NEXT_PUBLIC_`.
   - Never include secrets in test fixtures, screenshots, example files, or error messages.

2. **Authorization & Row-Level Security**:
   - All user data tables must have Supabase Row-Level Security (RLS) enabled with `user_id = auth.uid()`.
   - Every API handler and Server Action must authenticate the user session and verify resource ownership.

3. **Storage Security**:
   - The `books` storage bucket is strictly private.
   - Files are stored under user-scoped paths (`books/{auth.uid()}/{book_id}/...`).
   - Downloads/previews must use short-lived signed URLs.

4. **Answer-Key Protection**:
   - Question fetching endpoints (`/api/practice/next`) must NEVER return `correct_option` or `explanation` to the client.
   - Answer scoring is strictly server-side against stored database keys.
   - AI models must never grade extracted question-bank answers.

5. **Input Validation**:
   - Validate all API inputs, file metadata, and AI structured outputs using Zod schemas.
