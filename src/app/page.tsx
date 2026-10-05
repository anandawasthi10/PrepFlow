"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageContainer } from "@/components/ui/page-container";
import { Stack } from "@/components/ui/stack";
import { Layers } from "lucide-react";

export default function SmokeTestPage() {
  const [inputValue, setInputValue] = React.useState("");
  const [hasError, setHasError] = React.useState(false);

  return (
    <PageContainer size="default">
      <Stack spacing={8}>
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary-700 text-white">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">PrepFlow Design System</h1>
              <p className="text-sm text-slate-600">
                Milestone 1 Shared UI Component Showcase & Smoke Test
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="success">PF-001 App Initialized</Badge>
            <Badge variant="default">PF-002 Supabase Configured</Badge>
            <Badge variant="secondary">PF-006 Design Tokens Ready</Badge>
          </div>
        </div>

        {/* Section 1: Buttons & Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons & Badges</CardTitle>
            <CardDescription>
              Accessible interactive elements with distinct CVA variants.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Stack spacing={4}>
              <div className="flex flex-wrap gap-3 items-center">
                <Button variant="default">Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
                <Button variant="outline">Outline Action</Button>
                <Button variant="ghost">Ghost Action</Button>
                <Button variant="destructive">Destructive Action</Button>
                <Button isLoading>Loading State</Button>
                <Button disabled>Disabled Action</Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                <Badge variant="default">Primary Badge</Badge>
                <Badge variant="secondary">Secondary Badge</Badge>
                <Badge variant="success">Success / Correct</Badge>
                <Badge variant="warning">Warning / Revision Due</Badge>
                <Badge variant="error">Error / Incorrect</Badge>
                <Badge variant="outline">Outline Badge</Badge>
              </div>
            </Stack>
          </CardContent>
        </Card>

        {/* Section 2: Form Input & Dialog */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Accessible Form Input</CardTitle>
              <CardDescription>
                Input with label, helper, and ARIA error association.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Stack spacing={4}>
                <Input
                  label="Sample Input"
                  placeholder="Type something..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  helperText="Standard helper text for inputs."
                  error={hasError ? "This field is required or invalid." : undefined}
                />
                <Button variant="secondary" size="sm" onClick={() => setHasError((prev) => !prev)}>
                  {hasError ? "Clear Error" : "Trigger Validation Error"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accessible Dialog Modal</CardTitle>
              <CardDescription>
                Radix-based focus-trapped and keyboard-accessible modal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default">Open Demo Modal</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Modal Action</DialogTitle>
                    <DialogDescription>
                      This dialog is accessible via keyboard, traps focus while open, and closes
                      with the Escape key.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-2 text-sm text-slate-700">
                    Accessible dialogs will be used for destructive confirmations and book
                    management dialogs.
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary">Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: Feedback States */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Loading State</CardTitle>
              <CardDescription>
                Accessible status indicator with screen-reader announcement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoadingState message="Processing request..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Error State</CardTitle>
              <CardDescription>
                Accessible alert container with optional retry trigger.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ErrorState
                title="Service Notice"
                message="This is a demonstration of the accessible ErrorState component."
                onRetry={() => alert("Retry callback executed successfully.")}
                retryLabel="Retry Action"
              />
            </CardContent>
          </Card>
        </div>
      </Stack>
    </PageContainer>
  );
}
