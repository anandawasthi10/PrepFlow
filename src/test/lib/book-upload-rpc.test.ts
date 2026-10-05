import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("complete_book_upload RPC Migration Contract (PF-010)", () => {
  const migrationPath = path.resolve(
    __dirname,
    "../../../supabase/migrations/20261006000004_create_book_upload_rpc.sql"
  );
  const migrationContent = fs.readFileSync(migrationPath, "utf-8");

  it("defines SECURITY DEFINER SET search_path = ''", () => {
    expect(migrationContent).toContain("SECURITY DEFINER");
    expect(migrationContent).toContain("SET search_path = ''");
  });

  it("revokes execution from PUBLIC and anon, grants only to authenticated", () => {
    expect(migrationContent).toContain(
      "REVOKE ALL ON FUNCTION public.complete_book_upload(UUID) FROM PUBLIC;"
    );
    expect(migrationContent).toContain(
      "REVOKE ALL ON FUNCTION public.complete_book_upload(UUID) FROM anon;"
    );
    expect(migrationContent).toContain(
      "GRANT EXECUTE ON FUNCTION public.complete_book_upload(UUID) TO authenticated;"
    );
    expect(migrationContent).not.toContain("complete_onboarding(UUID)");
  });

  it("enforces single extraction job per book via partial unique index", () => {
    expect(migrationContent).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_book_jobs_single_extraction"
    );
    expect(migrationContent).toContain("WHERE (type = 'extraction'::public.job_type)");
  });

  it("locks the book row FOR UPDATE and verifies one-time transition uploading -> processing", () => {
    expect(migrationContent).toContain("FOR UPDATE;");
    expect(migrationContent).toContain("uploading");
    expect(migrationContent).toContain("processing");
  });
});
