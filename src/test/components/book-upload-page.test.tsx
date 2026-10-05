import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookUploadPage from "@/app/(dashboard)/books/upload/page";
import * as bookActions from "@/lib/books/actions";
import * as clientSupabase from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("BookUploadPage Component Accessibility & Interactions (PF-010)", () => {
  const mockPush = vi.fn();
  const mockUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);

    vi.spyOn(clientSupabase, "createClient").mockReturnValue({
      storage: {
        from: vi.fn(() => ({
          upload: mockUpload,
        })),
      },
    } as unknown as ReturnType<typeof clientSupabase.createClient>);
  });

  it("renders upload dropzone, inputs, and consent checkbox", () => {
    render(<BookUploadPage />);

    expect(screen.getByRole("heading", { name: /upload study document/i })).toBeInTheDocument();
    expect(screen.getByText(/click to select or drag and drop/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/document title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i confirm i have the lawful right/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload document/i })).toBeDisabled();
  });

  it("handles file selection, populates title, and completes upload", async () => {
    const user = userEvent.setup();
    mockUpload.mockResolvedValue({ error: null });

    vi.spyOn(bookActions, "initiateBookUploadAction").mockResolvedValue({
      success: true,
      bookId: "book-123",
      storagePath: "user-123/book-123/anatomy.pdf",
      sanitizedFilename: "anatomy.pdf",
    });

    vi.spyOn(bookActions, "completeBookUploadAction").mockResolvedValue({
      success: true,
      bookId: "book-123",
      jobId: "job-123",
      redirectTo: "/books",
    });

    const { container } = render(<BookUploadPage />);

    const file = new File(["dummy content"], "clinical_anatomy.pdf", { type: "application/pdf" });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText("clinical_anatomy.pdf")).toBeInTheDocument();
    expect((screen.getByLabelText(/document title/i) as HTMLInputElement).value).toBe(
      "clinical anatomy"
    );

    await user.click(screen.getByLabelText(/i confirm i have the lawful right/i));
    await user.click(screen.getByRole("button", { name: /upload document/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/upload complete/i);
    });
  });

  it("rejects files exceeding 50 MB", () => {
    const { container } = render(<BookUploadPage />);

    const bigFile = new File([""], "huge_book.pdf", { type: "application/pdf" });
    Object.defineProperty(bigFile, "size", { value: 60 * 1024 * 1024 });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [bigFile] } });

    expect(screen.getByRole("alert")).toHaveTextContent(/file is too large/i);
  });
});
