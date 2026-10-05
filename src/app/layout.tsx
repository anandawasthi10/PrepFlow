import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrepFlow — Hybrid AI Exam Practice & Progress Tracker",
  description: "AI-powered exam practice, spaced revision, and progress tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-950">{children}</body>
    </html>
  );
}
