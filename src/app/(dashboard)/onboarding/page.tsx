"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/ui/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Stack } from "@/components/ui/stack";
import { completeOnboardingAction } from "@/lib/onboarding/actions";
import { Sparkles, AlertCircle } from "lucide-react";

const EXAM_PRESETS = ["USMLE Step 1", "MCAT", "Bar Exam", "CFA Level 1", "NCLEX-RN", "GMAT Focus"];

const GOAL_PRESETS = [10, 20, 30, 50];

export default function OnboardingPage() {
  const router = useRouter();

  const [examName, setExamName] = React.useState("");
  const [examDate, setExamDate] = React.useState("");
  const [dailyGoal, setDailyGoal] = React.useState(20);
  const [timezone, setTimezone] = React.useState("UTC");
  const [isLoading, setIsLoading] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});

  React.useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
      }
    } catch {
      setTimezone("UTC");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append("examName", examName);
    formData.append("examDate", examDate);
    formData.append("dailyGoal", dailyGoal.toString());
    formData.append("timezone", timezone);

    try {
      const result = await completeOnboardingAction(formData);

      if (result.success && result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        if (result.error) {
          setFormError(result.error);
        }
        if (result.errors) {
          setFieldErrors(result.errors);
        }
      }
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer size="narrow">
      <div className="flex flex-col items-center justify-center min-h-[80vh] py-8">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Set Up Your Study Profile
            </CardTitle>
            <CardDescription>
              Personalize your exam target and daily practice goal to get started.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Stack spacing={6}>
              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                >
                  <AlertCircle
                    className="h-5 w-5 shrink-0 text-red-600 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <Stack spacing={6}>
                  {/* Exam Name */}
                  <div className="space-y-2">
                    <Input
                      id="examName"
                      name="examName"
                      label="Target Exam Name"
                      placeholder="e.g. USMLE Step 1"
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      required
                      disabled={isLoading}
                      error={fieldErrors.examName?.[0]}
                    />

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="text-xs text-slate-500 mr-1 py-0.5">Quick picks:</span>
                      {EXAM_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setExamName(preset)}
                          className="text-xs rounded-full px-2.5 py-0.5 bg-slate-100 hover:bg-primary-50 hover:text-primary-700 text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Date */}
                  <div className="space-y-1">
                    <Input
                      id="examDate"
                      name="examDate"
                      type="date"
                      label="Exam Date (Optional)"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      disabled={isLoading}
                      helperText="We will pace your daily question quota to complete your book before this date."
                      error={fieldErrors.examDate?.[0]}
                    />
                  </div>

                  {/* Daily Question Target */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="dailyGoal"
                        className="text-xs font-semibold text-slate-700 tracking-wide"
                      >
                        Daily Question Target
                      </label>
                      <span className="text-sm font-bold text-primary-700">
                        {dailyGoal} questions/day
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {GOAL_PRESETS.map((goal) => (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => setDailyGoal(goal)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-sm font-medium transition-all ${
                            dailyGoal === goal
                              ? "border-primary-600 bg-primary-50 text-primary-900 ring-2 ring-primary-500/20"
                              : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                          }`}
                        >
                          <span className="text-base font-bold">{goal}</span>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                            questions
                          </span>
                        </button>
                      ))}
                    </div>

                    <Input
                      id="dailyGoal"
                      name="dailyGoal"
                      type="number"
                      min={1}
                      max={500}
                      value={dailyGoal.toString()}
                      onChange={(e) =>
                        setDailyGoal(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))
                      }
                      disabled={isLoading}
                      error={fieldErrors.dailyGoal?.[0]}
                      className="mt-1"
                    />
                  </div>

                  {/* Timezone Information */}
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <span>Active Timezone:</span>
                    <span className="font-semibold text-slate-800">{timezone}</span>
                  </div>

                  <Button
                    type="submit"
                    variant="default"
                    className="w-full mt-2"
                    isLoading={isLoading}
                  >
                    Complete Setup & Go to Dashboard
                  </Button>
                </Stack>
              </form>
            </Stack>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
