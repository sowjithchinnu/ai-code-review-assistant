"use client";

import { useEffect, useState } from "react";
import { BookOpen, CalendarDays, FileText, Search, Sparkles, Trash2 } from "lucide-react";
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
import { CodeBlock, EmptyState, MetricsSkeleton, PageTransition, TableSkeleton } from "@/components/ui/dashboard-visuals";
import {
  fetchSubmissionHistory,
  deleteSubmission,
  type SubmissionHistoryItem,
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
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "findings" | "docs">("summary");
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSubmissions() {
      try {
        setIsLoading(true);
        const result = await fetchSubmissionHistory({
          search: search || undefined,
          language: language === "all" ? undefined : language,
          date: dateOrder,
          page,
          limit: 10,
        });

        if (isMounted) {
          setSubmissions(result.submissions);
          setPagination(result.pagination ?? null);
          setError(null);
          if (result.submissions.length > 0) {
            setSelectedSubmission((current) => {
              if (current && result.submissions.some((item) => item.id === current.id)) {
                return current;
              }

              return result.submissions[0];
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

    const confirmed = window.confirm(
      `Delete "${submission.title}"? This action cannot be undone.`
    );

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

  const complexityScore = (() => {
    switch (selectedSubmission?.complexity?.toLowerCase()) {
      case "high":
        return { value: "82/100", badge: "High risk" };
      case "medium":
        return { value: "64/100", badge: "Balanced" };
      default:
        return { value: "48/100", badge: "Low risk" };
    }
  })();

  const documentation = [
    {
      title: "Architecture notes",
      description: "A compact guide for the reviewed service and its responsibilities.",
    },
    {
      title: "Review checklist",
      description: "Best practices to validate before merging or shipping the change.",
    },
    {
      title: "Known edge cases",
      description: "Notes on stability, concurrency, and error-handling scenarios.",
    },
  ];

  const codeSample = `export async function reviewSubmission(data) {
  const summary = await analyze(data);
  return {
    score: summary.score,
    findings: summary.findings,
  };
}`;

  return (
    <PageTransition className="space-y-6">
      <div className="rounded-[28px] border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              AI review workspace
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Review History</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Explore your latest submissions, inspect the AI findings, and review the supporting documentation in one place.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit rounded-full">
            Always up to date
          </Badge>
        </div>
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
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : submissions.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No submissions found"
              description="Try a different search or reset the filters to bring back your review history."
            />
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
                      <TableRow
                        key={submission.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <TableCell className="font-medium">{submission.title}</TableCell>
                        <TableCell>{submission.language}</TableCell>
                        <TableCell>{formatDate(submission.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{submission.complexity}</Badge>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteSubmission(submission, e)}
                            disabled={isDeletingId === submission.id}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          >
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
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} • {pagination.totalCount} total submissions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={!pagination.hasPrevPage}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((current) => current + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur sm:p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">AI review panel</h3>
          </div>

          {!selectedSubmission ? (
            <EmptyState
              icon={FileText}
              title="Choose a submission"
              description="Select a row to open the AI summary, highlights, and the linked documentation."
            />
          ) : (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <p className="text-sm text-muted-foreground">Complexity</p>
                  <p className="mt-1 font-semibold">{selectedSubmission.complexity}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="mt-1 font-semibold">{complexityScore.value}</p>
                  <p className="text-xs text-muted-foreground">{complexityScore.badge}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 rounded-full border border-border/70 bg-background/70 p-1">
                {[
                  { id: "summary", label: "Summary" },
                  { id: "findings", label: "Findings" },
                  { id: "docs", label: "Docs" },
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

              {activeTab === "summary" && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Review summary
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                      {selectedSubmission.aiReviewSummary || "No AI summary available."}
                    </p>
                  </div>
                  <CodeBlock code={codeSample} language="typescript" title="review.ts" />
                </div>
              )}

              {activeTab === "findings" && (
                <div className="space-y-3">
                  {[
                    "Validate the new error-handling branch for edge cases.",
                    "Confirm the function stays readable under current complexity limits.",
                    "Check the API contract before widening the public interface.",
                  ].map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-2xl border border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "docs" && (
                <div className="space-y-3">
                  {documentation.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="rounded-2xl border border-border/60 bg-background/70 p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        Documentation
                      </div>
                      <h4 className="mt-2 font-semibold">{item.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
