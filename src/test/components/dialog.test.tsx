import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

describe("Dialog component", () => {
  it("opens modal on trigger click and displays title and description", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open Dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Modal Title</DialogTitle>
            <DialogDescription>Dialog detailed explanation text.</DialogDescription>
          </DialogHeader>
          <p>Dialog body content</p>
          <DialogClose asChild>
            <button>Close Action</button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByText("Dialog Modal Title")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    expect(screen.getByText("Dialog Modal Title")).toBeInTheDocument();
    expect(screen.getByText("Dialog detailed explanation text.")).toBeInTheDocument();
    expect(screen.getByText("Dialog body content")).toBeInTheDocument();
  });

  it("closes when the close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open Dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletable Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <button>Close Me</button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByRole("button", { name: /open dialog/i }));
    expect(screen.getByText("Deletable Title")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /close me/i }));
    expect(screen.queryByText("Deletable Title")).not.toBeInTheDocument();
  });

  it("closes when Escape key is pressed", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger asChild>
          <button>Open</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escape Modal</DialogTitle>
            <DialogDescription>Press Escape to dismiss</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );

    await user.click(screen.getByRole("button", { name: /open/i }));
    expect(screen.getByText("Escape Modal")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByText("Escape Modal")).not.toBeInTheDocument();
  });
});
