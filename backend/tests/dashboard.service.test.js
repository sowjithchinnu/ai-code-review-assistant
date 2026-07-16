const test = require("node:test");
const assert = require("node:assert/strict");

const { buildDashboardMetricsPayload } = require("../services/dashboard.service");

test("buildDashboardMetricsPayload maps database rows into dashboard payload", () => {
  const metrics = {
    totalSubmissions: 2,
    totalAiReviews: 2,
    totalIssuesFound: 5,
    averageCyclomaticComplexity: 8.5,
    latestSubmissions: [
      { id: 2, title: "Login flow", language: "JavaScript", created_at: "2024-01-02T00:00:00.000Z", ai_review_summary: "Looks good", cyclomatic_complexity: 9 },
    ],
    latestAiReviews: [
      { id: 2, title: "Login flow", language: "JavaScript", created_at: "2024-01-02T00:00:00.000Z", ai_review_summary: "Looks good" },
    ],
    languageDistribution: [
      { language: "JavaScript", count: 2 },
    ],
    complexitySummary: { low: 1, medium: 1, high: 0 },
  };

  const payload = buildDashboardMetricsPayload(metrics);

  assert.equal(payload.success, true);
  assert.equal(payload.metrics.submissions, 2);
  assert.equal(payload.metrics.aiReviews, 2);
  assert.equal(payload.metrics.issuesFound, 5);
  assert.equal(payload.metrics.averageCyclomaticComplexity, 8.5);
  assert.equal(payload.metrics.latestSubmissions.length, 1);
  assert.equal(payload.metrics.latestAiReviews.length, 1);
  assert.equal(payload.metrics.languageDistribution[0].language, "JavaScript");
});
