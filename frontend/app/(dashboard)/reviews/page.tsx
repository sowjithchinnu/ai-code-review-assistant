"use client";

import { useEffect, useState } from "react";
import { CalendarDays, FileText, Search } from "lucide-react";
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
import {
  fetchSubmissionHistory,
  type SubmissionHistoryItem,
} from "@/lib/api";

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ReviewsPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Review History</h2>
        <p className="text-muted-foreground">
          Search past submissions and open the full review details for any item.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm">
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
            <p className="text-sm text-muted-foreground">Loading submissions...</p>
          ) : error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : submissions.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              No submissions match the current filters.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Complexity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow
                        key={submission.id}
                        className="cursor-pointer hover:bg-muted/40"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <TableCell className="font-medium">{submission.title}</TableCell>
                        <TableCell>{submission.language}</TableCell>
                        <TableCell>{formatDate(submission.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{submission.complexity}</Badge>
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

        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">Review details</h3>
          </div>

          {!selectedSubmission ? (
            <div className="mt-4 rounded-md border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              Select a row to view the submission summary and complexity.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Title</p>
                <p className="font-medium">{selectedSubmission.title}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>{formatDate(selectedSubmission.created_at)}</span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Language</p>
                <p>{selectedSubmission.language}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Complexity</p>
                <Badge variant="secondary">{selectedSubmission.complexity}</Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">AI review summary</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {selectedSubmission.aiReviewSummary || "No AI summary available."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
