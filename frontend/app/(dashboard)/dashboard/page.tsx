"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";
import { createSubmission, fetchAnalysisResults, fetchDashboardMetrics } from "@/lib/api";
import type { AnalysisIssue, DashboardMetrics } from "@/lib/api";

const defaultMetrics = {
  submissions: 0,
  aiReviews: 0,
  issuesFound: 0,
  averageCyclomaticComplexity: 0,
  reviewCoverage: 0,
  reviewQuality: 0,
  releaseReadiness: 0,
  complexitySummary: { low: 0, medium: 0, high: 0 },
  latestSubmissions: [],
  latestAiReviews: [],
  languageDistribution: [],
  recentSubmissions: [],
} as DashboardMetrics;

function getScoreBand(score: number) {
  if (score >= 85) {
    return { label: "A", className: "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" };
  }

  if (score >= 70) {
    return { label: "B", className: "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400" };
  }

  return { label: "C", className: "border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-400" };
}

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

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics>(defaultMetrics);
  const [analysisIssues, setAnalysisIssues] = useState<AnalysisIssue[]>([]);

  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [inputMode, setInputMode] = useState<"paste" | "file">("paste");
  const [code, setCode] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [dashboardData, analysisData] = await Promise.all([fetchDashboardMetrics(), fetchAnalysisResults()]);
        if (active) {
          setMetrics(dashboardData);
          setAnalysisIssues(analysisData);
        }
      } catch (err) {
        console.error(err);
        toast({ title: "Unable to load metrics", description: "Falling back to defaults", variant: "destructive" });
      }
    };
    load();
    return () => { active = false; };
  }, [toast]);

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
      await createSubmission({ title: title.trim(), language, code: inputMode === "paste" ? code : undefined, file: inputMode === "file" ? selectedFile : null });
      toast({ title: "Submitted", description: "Submission received. Analysis will appear shortly.", variant: "success" });
      try {
        const [dashboardData, analysisData] = await Promise.all([fetchDashboardMetrics(), fetchAnalysisResults()]);
        setMetrics(dashboardData);
        setAnalysisIssues(analysisData);
      } catch (err) {
        console.warn("Failed to refresh metrics after submit", err);
      }
      router.push("/analysis");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const metricsState = metrics ?? defaultMetrics;
  const scoreBand = getScoreBand(Math.round(metricsState.reviewQuality));
  const issueCounts = getDerivedIssueCounts(analysisIssues);
  const maxLanguageCount = Math.max(1, ...metricsState.languageDistribution.map((item) => item.count));

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Code quality overview</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Quality dashboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">Review score, issues, complexity, and language breakdown come directly from the backend metrics.</p>
          </div>
          <Badge className={scoreBand.className}>{scoreBand.label} score</Badge>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Overall review score
            </div>
            <p className="mt-3 text-3xl font-semibold">{Math.round(metricsState.reviewQuality)}%</p>
            <p className="mt-1 text-sm text-muted-foreground">Release readiness {Math.round(metricsState.releaseReadiness)}%</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Bugs
            </div>
            <p className="mt-3 text-3xl font-semibold">{issueCounts.bugs}</p>
            <p className="mt-1 text-sm text-muted-foreground">From backend analysis findings</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Security issues
            </div>
            <p className="mt-3 text-3xl font-semibold">{issueCounts.securityIssues}</p>
            <p className="mt-1 text-sm text-muted-foreground">Security-focused findings</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Code smells
            </div>
            <p className="mt-3 text-3xl font-semibold">{issueCounts.codeSmells}</p>
            <p className="mt-1 text-sm text-muted-foreground">Warnings and maintainability notes</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Complexity</p>
              <Badge variant="secondary">{metricsState.averageCyclomaticComplexity.toFixed(1)} avg</Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold">{metricsState.complexitySummary.high} high risk</p>
            <div className="mt-3 flex gap-2 text-sm text-muted-foreground">
              <span>{metricsState.complexitySummary.low} low</span>
              <span>•</span>
              <span>{metricsState.complexitySummary.medium} medium</span>
              <span>•</span>
              <span>{metricsState.complexitySummary.high} high</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
            <p className="text-sm font-medium text-muted-foreground">Language distribution</p>
            <div className="mt-3 space-y-2">
              {metricsState.languageDistribution.length > 0 ? (
                metricsState.languageDistribution.map((item) => (
                  <div key={item.language}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.language}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${(item.count / maxLanguageCount) * 100}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No language data yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground">New submission</p>
          <h3 className="text-lg font-semibold">Submit code for review</h3>
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
                ].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setInputMode("paste")} className={`rounded-full px-4 py-2 text-sm ${inputMode === "paste" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              Paste Code
            </button>
            <button type="button" onClick={() => setInputMode("file")} className={`rounded-full px-4 py-2 text-sm ${inputMode === "file" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
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
              <input ref={fileInputRef} type="file" accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rs" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
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
    </div>
  );
}
