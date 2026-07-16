 const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface AnalysisIssue {
  rule?: string | null;
  severity: string;
  line?: number | null;
  message: string;
}

export interface SubmissionHistoryItem {
  id: number;
  title: string;
  language: string;
  created_at: string;
  aiReviewSummary: string;
  complexity: string;
}

export interface AiReviewItem {
  id: number;
  title: string;
  language: string;
  created_at: string;
  summary: string;
}

export interface LanguageDistributionItem {
  language: string;
  count: number;
}

export interface DashboardMetrics {
  submissions: number;
  aiReviews: number;
  issuesFound: number;
  averageCyclomaticComplexity: number;
  reviewCoverage: number;
  reviewQuality: number;
  releaseReadiness: number;
  complexitySummary: {
    low: number;
    medium: number;
    high: number;
  };
  latestSubmissions: SubmissionHistoryItem[];
  latestAiReviews: AiReviewItem[];
  languageDistribution: LanguageDistributionItem[];
  recentSubmissions: SubmissionHistoryItem[];
}

interface AnalysisResponse {
  success: boolean;
  analysis?: AnalysisIssue[];
  message?: string;
}

interface SubmissionHistoryResponse {
  success: boolean;
  submissions?: SubmissionHistoryItem[];
  pagination?: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message?: string;
}

interface DashboardMetricsResponse {
  success: boolean;
  metrics?: DashboardMetrics;
  message?: string;
}

export async function fetchAnalysisResults(): Promise<AnalysisIssue[]> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${API_URL}/api/submissions/analysis`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data: AnalysisResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "Failed to fetch analysis results");
  }

  return Array.isArray(data.analysis) ? data.analysis : [];
}

export async function fetchSubmissionHistory(params: {
  search?: string;
  language?: string;
  date?: string;
  page?: number;
  limit?: number;
} = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const query = new URLSearchParams();

  if (params.search) {
    query.set("search", params.search);
  }

  if (params.language) {
    query.set("language", params.language);
  }

  if (params.date) {
    query.set("date", params.date);
  }

  if (params.page) {
    query.set("page", String(params.page));
  }

  if (params.limit) {
    query.set("limit", String(params.limit));
  }

  const response = await fetch(
    `${API_URL}/api/submissions${query.toString() ? `?${query.toString()}` : ""}`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  const data: SubmissionHistoryResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "Failed to fetch submission history");
  }

  return {
    submissions: Array.isArray(data.submissions) ? data.submissions : [],
    pagination: data.pagination,
  };
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${API_URL}/api/dashboard/metrics`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data: DashboardMetricsResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "Failed to fetch dashboard metrics");
  }

  const metrics = data.metrics ?? {
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
  };

  return {
    submissions: metrics.submissions ?? 0,
    aiReviews: metrics.aiReviews ?? 0,
    issuesFound: metrics.issuesFound ?? 0,
    averageCyclomaticComplexity: metrics.averageCyclomaticComplexity ?? 0,
    reviewCoverage: metrics.reviewCoverage ?? 0,
    reviewQuality: metrics.reviewQuality ?? 0,
    releaseReadiness: metrics.releaseReadiness ?? 100,
    complexitySummary: metrics.complexitySummary ?? { low: 0, medium: 0, high: 0 },
    latestSubmissions: Array.isArray(metrics.latestSubmissions) ? metrics.latestSubmissions : [],
    latestAiReviews: Array.isArray(metrics.latestAiReviews) ? metrics.latestAiReviews : [],
    languageDistribution: Array.isArray(metrics.languageDistribution) ? metrics.languageDistribution : [],
    recentSubmissions: Array.isArray(metrics.recentSubmissions) ? metrics.recentSubmissions : [],
  };
}

export async function deleteSubmission(submissionId: number): Promise<{ success: boolean; message?: string }> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${API_URL}/api/submissions/${submissionId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "Failed to delete submission");
  }

  return {
    success: true,
    message: data.message,
  };
}

export async function forgotPassword(email: string): Promise<{ success: boolean; resetToken?: string; message?: string }> {
  const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "Failed to send password reset");
  }

  return {
    success: true,
    resetToken: data.resetToken,
    message: data.message,
  };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, newPassword }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message ?? "Failed to reset password");
  }

  return {
    success: true,
    message: data.message,
  };
}
