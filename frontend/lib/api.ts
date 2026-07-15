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
