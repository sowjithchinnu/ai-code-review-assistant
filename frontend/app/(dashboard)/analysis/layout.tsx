import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analysis | AI Code Review",
  description: "Static analysis results from code submissions",
};

export default function AnalysisLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
