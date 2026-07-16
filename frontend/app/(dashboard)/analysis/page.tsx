"use client";

import { useEffect, useState } from "react";
import { BookOpen, Code2, ScanSearch, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CodeBlock, EmptyState, MetricsSkeleton, PageTransition, TableSkeleton } from "@/components/ui/dashboard-visuals";
import { fetchAnalysisResults, type AnalysisIssue } from "@/lib/api";
import { cn } from "@/lib/utils";

function SeverityBadge({ severity }: { severity: string }) {
  const normalized = severity.toLowerCase();

  if (normalized === "error" || normalized === "fatal") {
    return <Badge variant="destructive">Error</Badge>;
  }

  if (normalized === "warning") {
    return (
      <Badge
        className={cn(
          "border-yellow-200 bg-yellow-100 text-yellow-800",
          "dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        )}
      >
        Warning
      </Badge>
    );
  }

  return <Badge variant="secondary">{severity}</Badge>;
}

export default function AnalysisPage() {
  const [issues, setIssues] = useState<AnalysisIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"issues" | "docs" | "sample">("issues");

  useEffect(() => {
    let isMounted = true;

    async function loadAnalysis() {
      try {
        const results = await fetchAnalysisResults();
        if (isMounted) {
          setIssues(results);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load analysis"
          );
          setIssues([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAnalysis();

    return () => {
      isMounted = false;
    };
  }, []);

  const summaryCards = [
    { title: "Critical issues", value: issues.filter((issue) => issue.severity.toLowerCase() === "error").length, note: "Needs attention" },
    { title: "Warnings", value: issues.filter((issue) => issue.severity.toLowerCase() === "warning").length, note: "Watch list" },
    { title: "Coverage", value: "87%", note: "Critical paths reviewed" },
  ];

  const documentation = [
    {
      title: "Security review guide",
      description: "Recommendations for auth and secret handling patterns.",
    },
    {
      title: "Complexity playbook",
      description: "Tips for breaking down large functions and reducing risk.",
    },
    {
      title: "Release checklist",
      description: "What to confirm before shipping a reviewed submission.",
    },
  ];

  const sampleCode = `function validateInput(input) {
  if (!input?.trim()) {
    return "missing value";
  }

  return input.toLowerCase();
}`;

  return (
    <PageTransition className="space-y-6">
      <div className="rounded-[28px] border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              Static analysis hub
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Analysis</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Review issues, view the recommended documentation, and inspect a syntax-highlighted example from the latest submission.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit rounded-full">
            Live insights
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <MetricsSkeleton />
          <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur">
            <TableSkeleton rows={6} />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : issues.length === 0 ? (
        <EmptyState
          icon={ScanSearch}
          title="No analysis results"
          description="Upload a JavaScript or Python file via a submission to run static analysis. Results will appear here."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {summaryCards.map((card, index) => (
              <div key={`${card.title}-${index}`} className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur">
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{card.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{card.note}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Findings board</p>
                <h3 className="text-lg font-semibold tracking-tight">Review issues and notes</h3>
              </div>
              <div className="flex flex-wrap gap-2 rounded-full border border-border/70 bg-background/70 p-1">
                {[
                  { id: "issues", label: "Issues" },
                  { id: "docs", label: "Docs" },
                  { id: "sample", label: "Sample" },
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              {activeTab === "issues" && (
                <div className="overflow-hidden rounded-2xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Rule</TableHead>
                        <TableHead className="min-w-[100px]">Severity</TableHead>
                        <TableHead className="w-16">Line</TableHead>
                        <TableHead className="min-w-[220px]">Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {issues.map((issue, index) => (
                        <TableRow key={`${issue.rule}-${issue.line}-${index}`}>
                          <TableCell className="font-mono text-xs sm:text-sm">
                            {issue.rule ?? "—"}
                          </TableCell>
                          <TableCell>
                            <SeverityBadge severity={issue.severity} />
                          </TableCell>
                          <TableCell>{issue.line ?? "—"}</TableCell>
                          <TableCell className="max-w-md whitespace-normal">
                            {issue.message}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === "docs" && (
                <div className="grid gap-4 lg:grid-cols-3">
                  {documentation.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        Documentation
                      </div>
                      <h4 className="mt-3 text-base font-semibold">{item.title}</h4>
                      <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "sample" && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Code2 className="h-4 w-4" />
                      Example snippet
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      A focused sample from a reviewable function with syntax-aware styling and helpful structure.
                    </p>
                  </div>
                  <CodeBlock code={sampleCode} language="javascript" title="example.js" />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </PageTransition>
  );
}
