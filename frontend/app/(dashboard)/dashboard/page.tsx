"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  Bug,
  CheckCircle2,
  Clock3,
  FileCode2,
  Gauge,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/ui/dashboard-visuals";
import { useToast } from "@/components/ui/toast-provider";
import { fetchDashboardMetrics } from "@/lib/api";
import type { DashboardMetrics } from "@/lib/api";

const emptyMetrics: DashboardMetrics = {
  submissions: 0,
  aiReviews: 0,
  issuesFound: 0,
  averageCyclomaticComplexity: 0,
  reviewCoverage: 0,
  reviewQuality: 0,
  releaseReadiness: 100,
  complexitySummary: {
    low: 0,
    medium: 0,
    high: 0,
  },
  latestSubmissions: [],
  latestAiReviews: [],
  languageDistribution: [],
  recentSubmissions: [],
};

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadMetrics = async () => {
      try {
        const data = await fetchDashboardMetrics();
        if (active) {
          setMetrics(data);
        }
      } catch (error) {
        console.error("Failed to load dashboard metrics", error);
        if (active) {
          setMetrics(emptyMetrics);
          toast({
            title: "Dashboard unavailable",
            description: "Unable to load live metrics right now.",
            variant: "destructive",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMetrics();

    return () => {
      active = false;
    };
  }, [toast]);

  const metricsState = metrics ?? emptyMetrics;
  const totalSubmissions = metricsState.submissions;
  const languageProgressItems = metricsState.languageDistribution.map((item, index) => ({
    id: `language-${item.language || index}`,
    label: item.language || "Unknown",
    value: totalSubmissions > 0 ? Math.round((item.count / totalSubmissions) * 100) : 0,
  }));

  const statCards = [
    {
      id: "stat-submissions",
      label: "Submissions",
      value: metricsState.submissions.toString(),
      detail:
        metricsState.submissions === 1
          ? "1 submission captured"
          : `${metricsState.submissions} submissions captured`,
      icon: FileCode2,
    },
    {
      id: "stat-ai-reviews",
      label: "AI reviews",
      value: metricsState.aiReviews.toString(),
      detail:
        metricsState.aiReviews === 1
          ? "1 review generated"
          : `${metricsState.aiReviews} reviews generated`,
      icon: Bot,
    },
    {
      id: "stat-issues-found",
      label: "Issues found",
      value: metricsState.issuesFound.toString(),
      detail: metricsState.issuesFound === 1 ? "1 issue captured" : `${metricsState.issuesFound} issues captured`,
      icon: Bug,
    },
    {
      id: "stat-average-complexity",
      label: "Avg complexity",
      value: metricsState.averageCyclomaticComplexity > 0 ? metricsState.averageCyclomaticComplexity.toFixed(1) : "0.0",
      detail: totalSubmissions > 0 ? `${totalSubmissions} submission${totalSubmissions === 1 ? "" : "s"} included in the average` : "No submissions yet",
      icon: Gauge,
    },
  ];

  const overviewCards = [
    {
      id: "overview-review-coverage",
      label: "Review coverage",
      value: `${metricsState.reviewCoverage}%`,
      detail: "AI review coverage across submissions",
      icon: CheckCircle2,
      tone: "text-emerald-500",
    },
    {
      id: "overview-high-priority",
      label: "Issues logged",
      value: metricsState.issuesFound.toString(),
      detail: "Issues captured across submissions",
      icon: Activity,
      tone: "text-sky-500",
    },
    {
      id: "overview-release-readiness",
      label: "Release readiness",
      value: `${metricsState.releaseReadiness}%`,
      detail: "Based on current issue volume",
      icon: ArrowUpRight,
      tone: "text-violet-500",
    },
  ];

  const quickActions = metricsState.latestSubmissions.slice(0, 3).map((submission, index) => ({
    id: submission.id ? `quick-action-${submission.id}` : `quick-action-${index}`,
    label: submission.title || `Submission ${index + 1}`,
    detail: `${submission.language} • ${submission.complexity}`,
  }));

  const activityItems = metricsState.latestAiReviews.length > 0
    ? metricsState.latestAiReviews.slice(0, 3).map((review, index) => ({
        id: review.id ? `review-${review.id}` : `review-${index}`,
        title: review.title || `AI review ${index + 1}`,
        description: review.summary || "Review summary is being prepared.",
        time: formatRelativeTime(review.created_at),
        icon: index === 0 ? ShieldCheck : AlertTriangle,
      }))
    : [
        {
          id: "activity-empty",
          title: "No AI reviews yet",
          description: "Submit a snippet to generate the first review summary.",
          time: "Waiting",
          icon: Clock3,
        },
      ];

  return (
    <PageTransition className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.35)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_45%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              AI Review Copilot
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome back
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                {loading
                  ? "Loading the latest submission and analysis metrics..."
                  : "Your latest submissions, reviews, and analysis findings are now reflected in real time below."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => toast({ title: "Review started", description: "A fresh review workflow is ready to go." })}
            >
              Start new review
            </Button>
            <Button
              variant="outline"
              onClick={() => toast({ title: "Insights ready", description: "Your latest dashboard snapshot is live." })}
            >
              View insights
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.id}
              className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">{stat.value}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{stat.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Overview</p>
              <h2 className="text-xl font-semibold tracking-tight">Live review health</h2>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {loading ? "Loading" : "Live"}
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {overviewCards.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Icon className={`h-4 w-4 ${item.tone}`} />
                    {item.label}
                  </div>
                  <p className="mt-3 text-2xl font-semibold">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Language distribution</p>
                <p className="text-lg font-semibold">
                  {metricsState.submissions > 0
                    ? `${metricsState.submissions} submission${metricsState.submissions === 1 ? "" : "s"}`
                    : "No submissions yet"}
                </p>
              </div>
              <Badge variant="outline">
                {metricsState.languageDistribution.length > 0 ? `${metricsState.languageDistribution.length} languages` : "No languages"}
              </Badge>
            </div>
            <div className="mt-4 space-y-3">
              {languageProgressItems.length > 0 ? (
                languageProgressItems.map((item) => (
                  <div key={item.id}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-background/70 px-3 py-3 text-sm text-muted-foreground">
                  Language breakdown will appear here once submissions exist.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quick actions</p>
                <h3 className="text-lg font-semibold tracking-tight">Latest submissions</h3>
              </div>
              <Button size="sm" variant="outline">
                New review
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {quickActions.length > 0 ? (
                quickActions.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm"
                  >
                    <span>{item.label}</span>
                    <span className="text-muted-foreground">{item.detail}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-background/70 px-3 py-3 text-sm text-muted-foreground">
                  No recent submissions available yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent activity</p>
                <h3 className="text-lg font-semibold tracking-tight">Latest AI reviews</h3>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {activityItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.id} className="flex gap-3 rounded-xl border border-border/60 bg-background/70 p-3">
                    <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
