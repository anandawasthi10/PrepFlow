import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingPage from "@/app/(dashboard)/onboarding/page";
import * as onboardingActions from "@/lib/onboarding/actions";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("OnboardingPage Component Accessibility & Interactions (PF-009)", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
  });

  it("renders accessible inputs, headings, and quick pick presets", () => {
    render(<OnboardingPage />);

    expect(screen.getByRole("heading", { name: /set up your study profile/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/target exam name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/exam date/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /complete setup & go to dashboard/i })
    ).toBeInTheDocument();

    // Verify preset exam buttons
    expect(screen.getByRole("button", { name: /usmle step 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /bar exam/i })).toBeInTheDocument();
  });

  it("populates exam name when preset button is clicked", async () => {
    const user = userEvent.setup();
    render(<OnboardingPage />);

    const mcatButton = screen.getByRole("button", { name: /mcat/i });
    await user.click(mcatButton);

    const examInput = screen.getByLabelText(/target exam name/i) as HTMLInputElement;
    expect(examInput.value).toBe("MCAT");
  });

  it("submits onboarding form and navigates to dashboard on success", async () => {
    const user = userEvent.setup();
    vi.spyOn(onboardingActions, "completeOnboardingAction").mockResolvedValue({
      success: true,
      redirectTo: "/dashboard",
      examId: "mock-exam-id",
    });

    render(<OnboardingPage />);

    await user.type(screen.getByLabelText(/target exam name/i), "USMLE Step 1");
    await user.click(screen.getByRole("button", { name: /complete setup & go to dashboard/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("displays error alert when onboarding action returns failure", async () => {
    const user = userEvent.setup();
    vi.spyOn(onboardingActions, "completeOnboardingAction").mockResolvedValue({
      success: false,
      error: "Unable to save your onboarding setup. Please try again.",
    });

    render(<OnboardingPage />);

    await user.type(screen.getByLabelText(/target exam name/i), "USMLE Step 1");
    await user.click(screen.getByRole("button", { name: /complete setup & go to dashboard/i }));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/unable to save your onboarding setup/i);
    });
  });
});
