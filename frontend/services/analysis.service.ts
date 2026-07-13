const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getAnalysis() {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const response = await fetch(`${API_URL}/api/submissions/analysis`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return response.json();
}
