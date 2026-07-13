"use client";

import { useEffect, useState } from "react";
import { ScanSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Analysis</h2>
        <p className="text-muted-foreground">
          Static analysis results from your latest file submission.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
          <p className="text-sm text-muted-foreground">Loading analysis...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-card-foreground shadow-sm">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <ScanSearch className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No analysis results</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Upload a JavaScript or Python file via a submission to run static
            analysis. Results will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Rule</TableHead>
                <TableHead className="min-w-[100px]">Severity</TableHead>
                <TableHead className="w-16">Line</TableHead>
                <TableHead className="min-w-[200px]">Message</TableHead>
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
    </div>
  );
}
