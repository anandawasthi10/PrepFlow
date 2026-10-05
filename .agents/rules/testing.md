# Testing & Quality Verification Rules

1. **Mandatory Post-Ticket Verification**:
   - After implementing any feature ticket, verify that:
     1. TypeScript compilation passes (`tsc --noEmit`).
     2. Linter passes (`eslint`).
     3. Unit and integration tests for modified and affected modules pass.

2. **Core Test Coverage Priorities**:
   - **Order Preservation**: Extracted questions must strictly follow original numbered sequence ($Q_1 \rightarrow Q_2 \dots$).
   - **Deterministic Scoring**: Correct option matches stored database key exactly.
   - **Theory Persistence**: Theory questions are generated once, validated, stored with source citation, and never regenerated differently for the same sequence position.
   - **RLS & Multi-Tenancy**: Explicit negative tests verifying users cannot read, mutate, or delete other users' books, questions, sessions, or attempts.
   - **Timezone Calculations**: Daily goal boundaries and yesterday summaries correctly calculate across midnight and daylight-saving boundaries.

3. **Rate Limit & External Service Mocking**:
   - Tests and local development must execute without requiring live external accounts (Inngest Cloud, Upstash Redis, OpenAI). Use in-memory drivers, local dev servers, and mocked responses.
