"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ScanSearch, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, MetricsSkeleton, PageTransition, TableSkeleton } from "@/components/ui/dashboard-visuals";
import { fetchAnalysisResults, fetchSubmissionHistory, type AnalysisIssue } from "@/lib/api";
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
  const [latestTitle, setLatestTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalysis() {
      try {
        const [analysisResults, historyResult] = await Promise.all([
          fetchAnalysisResults(),
          fetchSubmissionHistory({ page: 1, limit: 1, date: "newest" }),
        ]);

        if (isMounted) {
          setIssues(analysisResults);
          setLatestTitle(historyResult.submissions?.[0]?.title ?? null);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load analysis");
          setIssues([]);
          setLatestTitle(null);
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

  const bugs = issues.filter((issue) => ["error", "fatal"].includes(issue.severity.toLowerCase())).length;
  const securityIssues = issues.filter((issue) => /security|auth|token|secret|injection|sanitize|unsafe|cors|xss|sql/i.test(`${issue.rule ?? ""} ${issue.message}`.toLowerCase())).length;
  const codeSmells = issues.filter((issue) => issue.severity.toLowerCase() === "warning").length;

  return (
    <PageTransition className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Analysis</h2>
        {latestTitle ? <p className="mt-2 text-sm font-medium text-foreground/80">Latest submission: {latestTitle}</p> : null}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <MetricsSkeleton />
          <div className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
            <TableSkeleton rows={6} />
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 shadow-sm">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : issues.length === 0 ? (
        <EmptyState
          icon={ScanSearch}
          title="No analysis results"
          description={
            latestTitle
              ? "No issues were found in the latest submission. Your code looks clean."
              : "Upload a JavaScript or Python file via a submission to run static analysis. Results will appear here."
          }
        />
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Issues</p>
              <p className="mt-2 text-xl font-semibold">{issues.length}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                Bugs
              </div>
              <p className="mt-2 text-xl font-semibold">{bugs}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
                Security issues
              </div>
              <p className="mt-2 text-xl font-semibold">{securityIssues}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Findings</p>
                <h3 className="text-lg font-semibold">Issue breakdown</h3>
              </div>
              <Badge variant="secondary">{codeSmells} code smells</Badge>
            </div>

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
                      <TableCell className="font-mono text-xs sm:text-sm">{issue.rule ?? "—"}</TableCell>
                      <TableCell><SeverityBadge severity={issue.severity} /></TableCell>
                      <TableCell>{issue.line ?? "—"}</TableCell>
                      <TableCell className="max-w-md whitespace-normal">{issue.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </PageTransition>
  );
}
