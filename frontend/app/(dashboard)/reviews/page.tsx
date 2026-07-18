"use client";

import { useEffect, useState } from "react";
import { Activity, BookOpen, FileText, Search, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, MetricsSkeleton, PageTransition, TableSkeleton } from "@/components/ui/dashboard-visuals";
import {
  fetchSubmissionHistory,
  deleteSubmission,
  fetchAnalysisResults,
  type SubmissionHistoryItem,
  type AnalysisIssue,
} from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ReviewsPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<SubmissionHistoryItem[]>([]);
  const [analysisIssues, setAnalysisIssues] = useState<AnalysisIssue[]>([]);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("all");
  const [dateOrder, setDateOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSubmissions() {
      try {
        setIsLoading(true);
        const [historyResult, analysisResult] = await Promise.all([fetchSubmissionHistory({
          search: search || undefined,
          language: language === "all" ? undefined : language,
          date: dateOrder,
          page,
          limit: 10,
        }), fetchAnalysisResults()]);

        if (isMounted) {
          setSubmissions(historyResult.submissions);
          setPagination(historyResult.pagination ?? null);
          setAnalysisIssues(analysisResult);
          setError(null);
          if (historyResult.submissions.length > 0) {
            setSelectedSubmission((current) => {
              if (current && historyResult.submissions.some((item) => item.id === current.id)) {
                return current;
              }

              return historyResult.submissions[0];
            });
          } else {
            setSelectedSubmission(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load history");
          setSubmissions([]);
          setPagination(null);
          setAnalysisIssues([]);
          setSelectedSubmission(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    const timeout = window.setTimeout(loadSubmissions, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timeout);
    };
  }, [search, language, dateOrder, page]);

  const handleDeleteSubmission = async (submission: SubmissionHistoryItem, event: React.MouseEvent) => {
    event.stopPropagation();

    const confirmed = window.confirm(`Delete "${submission.title}"? This action cannot be undone.`);

    if (!confirmed) return;

    try {
      setIsDeletingId(submission.id);
      await deleteSubmission(submission.id);

      toast({
        title: "Submission deleted",
        description: `"${submission.title}" has been successfully deleted.`,
        variant: "success",
      });

      setSubmissions((prev) => prev.filter((item) => item.id !== submission.id));
      if (selectedSubmission?.id === submission.id) {
        setSelectedSubmission(null);
      }

      if (submissions.length <= 1 && page > 1) {
        setPage(page - 1);
      }
    } catch (err) {
      toast({
        title: "Failed to delete",
        description: err instanceof Error ? err.message : "Failed to delete submission",
        variant: "destructive",
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  const complexityLabel = (selectedSubmission?.complexity ?? "low").toLowerCase();
  const complexityScore = (() => {
    switch (complexityLabel) {
      case "high":
        return { value: "82/100", badge: "High risk", className: "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400" };
      case "medium":
        return { value: "64/100", badge: "Balanced", className: "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400" };
      default:
        return { value: "48/100", badge: "Low risk", className: "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" };
    }
  })();

  const securityIssues = analysisIssues.filter((issue) => /security|auth|token|secret|injection|sanitize|unsafe|cors|xss|sql/i.test(`${issue.rule ?? ""} ${issue.message}`.toLowerCase())).length;

  return (
    <PageTransition className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review History</h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4 rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by title or language"
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All languages</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
              </select>

              <select
                value={dateOrder}
                onChange={(event) => {
                  setDateOrder(event.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <MetricsSkeleton />
              <TableSkeleton rows={6} />
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
          ) : submissions.length === 0 ? (
            <EmptyState icon={Search} title="No submissions found" description="Try a different search or reset the filters to bring back your review history." />
          ) : (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Complexity</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setSelectedSubmission(submission)}>
                        <TableCell className="font-medium">{submission.title}</TableCell>
                        <TableCell>{submission.language}</TableCell>
                        <TableCell>{formatDate(submission.created_at)}</TableCell>
                        <TableCell><Badge variant="secondary">{submission.complexity}</Badge></TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => handleDeleteSubmission(submission, e)} disabled={isDeletingId === submission.id} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {pagination && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages} • {pagination.totalCount} total submissions</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={!pagination.hasPrevPage}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((current) => current + 1)} disabled={!pagination.hasNextPage}>Next</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Review detail</h3>
          </div>

          {!selectedSubmission ? (
            <EmptyState icon={FileText} title="Choose a submission" description="Select a row to review its backend-backed summary and analysis context." />
          ) : (
            <div className="mt-4 space-y-3">
              <section className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    AI Summary
                  </div>
                  <Badge variant="secondary">{selectedSubmission.language}</Badge>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{selectedSubmission.aiReviewSummary || "No AI summary available."}</p>
              </section>

              <section className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Static Analysis
                  </div>
                  <Badge variant="secondary">{analysisIssues.length} findings</Badge>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Issues</p>
                    <p className="mt-1 text-lg font-semibold">{analysisIssues.length}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Security</p>
                    <p className="mt-1 text-lg font-semibold">{securityIssues}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Activity className="h-4 w-4" />
                    Complexity Report
                  </div>
                  <Badge className={complexityScore.className}>{complexityScore.badge}</Badge>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold">{selectedSubmission.complexity}</p>
                    <p className="text-sm text-muted-foreground">Score {complexityScore.value}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedSubmission.created_at ? formatDate(selectedSubmission.created_at) : "No timestamp"}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  Documentation
                </div>
                <div className="mt-3 space-y-2">
                  <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Title</p>
                    <p className="mt-1 font-medium">{selectedSubmission.title}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Language</p>
                    <p className="mt-1 font-medium">{selectedSubmission.language}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Review context</p>
                    <p className="mt-1 font-medium">Complexity {complexityLabel} • Generated {formatDate(selectedSubmission.created_at)}</p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
