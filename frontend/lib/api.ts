const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface AnalysisIssue {
  rule?: string | null;
  severity: string;
  line?: number | null;
  message: string;
}

interface AnalysisResponse {
  success: boolean;
  analysis?: AnalysisIssue[];
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
