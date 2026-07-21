"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CodeBlock } from "@/components/ui/dashboard-visuals";
import { useToast } from "@/components/ui/toast-provider";
import { createSubmission, fetchAnalysisResults, fetchDashboardMetrics, fetchSubmissionHistory } from "@/lib/api";
import type { AnalysisIssue, DashboardMetrics, SubmissionHistoryItem } from "@/lib/api";

type ReviewTab = "summary" | "findings" | "complexity";

const defaultMetrics = {
  submissions: 0,
  aiReviews: 0,
  issuesFound: 0,
  averageCyclomaticComplexity: 0,
  reviewCoverage: 0,
  reviewQuality: 0,
  releaseReadiness: 100,
  complexitySummary: { low: 0, medium: 0, high: 0 },
  latestSubmissions: [],
  latestAiReviews: [],
  languageDistribution: [],
  recentSubmissions: [],
} as DashboardMetrics;

function getDerivedIssueCounts(issues: AnalysisIssue[]) {
  const normalized = issues.map((issue) => `${issue.rule ?? ""} ${issue.message}`.toLowerCase());

  const bugs = issues.filter((issue) => {
    const severity = issue.severity.toLowerCase();
    return severity === "error" || severity === "fatal" || /bug|exception|crash/.test(`${issue.rule ?? ""} ${issue.message}`.toLowerCase());
  }).length;

  const securityIssues = normalized.filter((text) => /security|auth|token|secret|injection|sanitize|unsafe|cors|xss|sql/i.test(text)).length;
  const codeSmells = issues.filter((issue) => {
    const severity = issue.severity.toLowerCase();
    return severity === "warning" || /smell|style|complex|maintain/.test(`${issue.rule ?? ""} ${issue.message}`.toLowerCase());
  }).length;

  return { bugs, securityIssues, codeSmells };
}

// Severity helpers removed in favor of static 'error' badge rendering in Findings

function getFileExtension(language: string) {
  switch (language.toLowerCase()) {
    case "javascript":
      return ".js";
    case "typescript":
      return ".ts";
    case "python":
      return ".py";
    case "java":
      return ".java";
    case "c++":
      return ".cpp";
    case "c":
      return ".c";
    default:
      return ".txt";
  }
}

function formatSubmissionFileName(title: string, language: string) {
  const trimmed = title?.trim() || "submission";
  if (/\.[^.]+$/.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  const baseName = trimmed.replace(/\s+/g, "-").toLowerCase();
  return `${baseName}${getFileExtension(language)}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [currentSubmission, setCurrentSubmission] = useState<SubmissionHistoryItem | null>(null);
  const [submittedCode, setSubmittedCode] = useState("");
  const [analysisIssues, setAnalysisIssues] = useState<AnalysisIssue[]>([]);
  const [activeReviewTab, setActiveReviewTab] = useState<ReviewTab>("summary");
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [inputMode, setInputMode] = useState<"paste" | "file">("paste");
  const [code, setCode] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codePanelRef = useRef<HTMLDivElement>(null);

  async function refreshCurrentReview() {
    setIsLoading(true);

    try {
      const [dashboardData, analysisData, historyData] = await Promise.all([
        fetchDashboardMetrics(),
        fetchAnalysisResults(),
        fetchSubmissionHistory({ page: 1, limit: 1, date: "newest" }),
      ]);

      const latestMetricSubmission = dashboardData.latestSubmissions[0] ?? null;
      const latestHistorySubmission = historyData.submissions[0] ?? null;
      const mergedSubmission = latestHistorySubmission
        ? {
            ...(latestMetricSubmission ?? {}),
            ...latestHistorySubmission,
            aiReviewSummary:
              latestHistorySubmission.aiReviewSummary ?? latestMetricSubmission?.aiReviewSummary ?? "",
            complexity:
              latestHistorySubmission.complexity ?? latestMetricSubmission?.complexity ?? "Pending",
            code: latestHistorySubmission.code ?? latestMetricSubmission?.code ?? "",
            documentation:
              latestHistorySubmission.documentation ?? currentSubmission?.documentation ?? latestMetricSubmission?.documentation ?? null,
          }
        : {
            ...(latestMetricSubmission ?? {}),
            documentation: latestMetricSubmission?.documentation ?? currentSubmission?.documentation ?? null,
          };

      setMetrics(dashboardData);
      setAnalysisIssues(analysisData);
      setCurrentSubmission(mergedSubmission as SubmissionHistoryItem | null);
      setSubmittedCode(mergedSubmission?.code ?? "");
    } catch (err) {
      console.warn(err);
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      if (message.includes("unauthorized") || message.includes("access denied")) {
        router.push("/login");
        return;
      }

      toast({
        title: "Unable to refresh review",
        description: "Could not load the latest review details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    const loadInitialData = async () => {
      try {
        const [dashboardData, analysisData, historyData] = await Promise.all([
          fetchDashboardMetrics(),
          fetchAnalysisResults(),
          fetchSubmissionHistory({ page: 1, limit: 1, date: "newest" }),
        ]);

        if (!active) return;

        const latestMetricSubmission = dashboardData.latestSubmissions[0] ?? null;
        const latestHistorySubmission = historyData.submissions[0] ?? null;
        const mergedSubmission = latestHistorySubmission
          ? {
              ...(latestMetricSubmission ?? {}),
              ...latestHistorySubmission,
              aiReviewSummary:
                latestHistorySubmission.aiReviewSummary ?? latestMetricSubmission?.aiReviewSummary ?? "",
              complexity:
                latestHistorySubmission.complexity ?? latestMetricSubmission?.complexity ?? "Pending",
              code: latestHistorySubmission.code ?? latestMetricSubmission?.code ?? "",
              documentation:
                latestHistorySubmission.documentation ?? currentSubmission?.documentation ?? latestMetricSubmission?.documentation ?? null,
            }
          : {
              ...(latestMetricSubmission ?? {}),
              documentation: latestMetricSubmission?.documentation ?? currentSubmission?.documentation ?? null,
            };

        setMetrics(dashboardData);
        setAnalysisIssues(analysisData);
        setCurrentSubmission(mergedSubmission as SubmissionHistoryItem | null);
        setSubmittedCode(mergedSubmission?.code ?? "");
      } catch (err) {
        console.warn(err);
        const message = err instanceof Error ? err.message.toLowerCase() : "";
        if (message.includes("unauthorized") || message.includes("access denied")) {
          router.push("/login");
          return;
        }

        toast({
          title: "Unable to load current review",
          description: "Review data is unavailable right now.",
          variant: "destructive",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadInitialData();

    return () => {
      active = false;
    };
  }, [toast, router]);

  useEffect(() => {
    if (highlightedLine === null) return;

    const timeout = window.setTimeout(() => {
      const target = codePanelRef.current?.querySelector(`[data-line-number="${highlightedLine}"]`) as HTMLElement | null;
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [highlightedLine, submittedCode]);

  

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    if (!title.trim()) {
      toast({ title: "Title required", description: "Please provide a title for the submission.", variant: "destructive" });
      return;
    }

    if (inputMode === "paste" && !code.trim()) {
      toast({ title: "Code required", description: "Paste the code you want analyzed.", variant: "destructive" });
      return;
    }

    if (inputMode === "file" && !selectedFile) {
      toast({ title: "File required", description: "Please choose a file to upload.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const resp = await createSubmission({
        title: title.trim(),
        language,
        code: inputMode === "paste" ? code : undefined,
        file: inputMode === "file" ? selectedFile : null,
      });

      toast({ title: "Submitted", description: "Your analysis will appear below shortly.", variant: "success" });
      setTitle("");
      setCode("");
      setSelectedFile(null);

      // If the server returned analysis in the POST response, use it immediately
      if (resp && Array.isArray(resp.analysis)) {
        setAnalysisIssues(resp.analysis);
      }

      // Refresh to pick up any other derived fields (history, metrics)
      await refreshCurrentReview();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const issueCounts = getDerivedIssueCounts(analysisIssues);
  const reviewTabs: Array<{ value: ReviewTab; label: string }> = [
    { value: "summary", label: "AI Summary" },
    { value: "findings", label: "Findings" },
    { value: "complexity", label: "Complexity" },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground">New submission</p>
          <h2 className="mt-1 text-xl font-semibold">Submit code for review</h2>
          <p className="mt-2 text-sm text-muted-foreground">Submit code right from the dashboard and keep the current review visible below.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Title</label>
              <Input placeholder="Submission title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Language</label>
              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {[
                  "JavaScript",
                  "TypeScript",
                  "Python",
                  "Java",
                  "Go",
                  "Rust",
                  "C++",
                  "C",
                  "Other",
                ].map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputMode("paste")}
              className={`rounded-full px-4 py-2 text-sm ${inputMode === "paste" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Paste Code
            </button>
            <button
              type="button"
              onClick={() => setInputMode("file")}
              className={`rounded-full px-4 py-2 text-sm ${inputMode === "file" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Upload File
            </button>
          </div>

          {inputMode === "paste" ? (
            <div>
              <label className="text-sm font-medium">Source code</label>
              <Textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your code here" />
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rs"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">{selectedFile ? selectedFile.name : "No file selected"}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Analyzing…" : "Analyze Code"}</Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">Current Review</h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                Review Complete
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Analysis complete</p>
            {currentSubmission && <p className="text-base font-medium text-foreground/80">{currentSubmission.title}</p>}
          </div>
          {currentSubmission ? (
            <Badge variant="secondary">{currentSubmission.language}</Badge>
          ) : null}
        </div>

        {isLoading ? (
          <div className="mt-5 rounded-2xl border border-border/60 bg-background/70 p-5 text-sm text-muted-foreground">Loading current review data…</div>
        ) : currentSubmission ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted source</p>
                  <p className="mt-1 text-lg font-semibold">{formatSubmissionFileName(currentSubmission.title, currentSubmission.language)}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-900/30 dark:text-slate-300">
                  {currentSubmission.language}
                </span>
              </div>
              <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-slate-950/95 shadow-inner" ref={codePanelRef}>
                <div className="max-h-[32rem] overflow-auto">
                  <CodeBlock
                    code={submittedCode || "// No source code available for this submission yet."}
                    language={currentSubmission.language || "text"}
                    title={`${currentSubmission.title}.${currentSubmission.language || "txt"}`}
                    className="rounded-none border-0 shadow-none"
                    showLineNumbers
                    highlightedLineNumber={highlightedLine ?? undefined}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-border/60 pb-4">
              {reviewTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveReviewTab(tab.value)}
                  className={`rounded-full px-3 py-1.5 text-sm ${activeReviewTab === tab.value ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeReviewTab === "summary" ? (
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4" />
                  AI review summary
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
                  {currentSubmission.aiReviewSummary || "No AI summary available yet."}
                </p>
              </div>
            ) : null}

            {activeReviewTab === "findings" ? (
              <div className="space-y-3">
                {analysisIssues.length > 0 ? (
                  analysisIssues.map((issue, index) => (
                    <button
                      type="button"
                      key={`${issue.rule ?? "finding"}-${issue.line ?? "none"}-${index}`}
                      onClick={() => setHighlightedLine(issue.line ?? null)}
                      className="w-full rounded-2xl border border-border/60 bg-background/70 p-4 text-left transition-colors hover:border-primary/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <p className="text-base font-semibold text-foreground lowercase">{issue.rule ?? "finding"}</p>
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-semibold"
                              style={{
                                backgroundColor: "#3b0f12",
                                color: "#f06262",
                                border: "1px solid rgba(0,0,0,0.45)",
                                boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.25)",
                              }}
                            >
                              error
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-muted-foreground">{issue.message}</p>
                        </div>

                        <div className="flex-shrink-0">
                          <span className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground">Line {issue.line ?? "n/a"}</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-100/60 p-6 text-sm text-foreground shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                        ✓
                      </span>
                      <div>
                        <p className="text-base font-semibold">Great job! Your code passed static analysis.</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          No linting errors, code smells, or security findings were detected.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {activeReviewTab === "complexity" ? (
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    Complexity
                  </div>
                  <p className="mt-3 text-2xl font-semibold">{currentSubmission.complexity || "—"}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Average cyclomatic complexity {metrics.averageCyclomaticComplexity.toFixed(1)}.</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Review health
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                      <span className="text-muted-foreground">Bugs</span>
                      <span className="font-semibold">{issueCounts.bugs}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                      <span className="text-muted-foreground">Security</span>
                      <span className="font-semibold">{issueCounts.securityIssues}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                      <span className="text-muted-foreground">Code smells</span>
                      <span className="font-semibold">{issueCounts.codeSmells}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    Submitted
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground">{new Date(currentSubmission.created_at).toLocaleString()}</p>
                </div>
              </div>
            ) : null}

          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-border/60 bg-background/70 p-5 text-sm text-muted-foreground">
            No active review is available yet. Submit your code above to start analysis. Previous submissions remain in Reviews.
          </div>
        )}
      </section>
    </div>
  );
}
