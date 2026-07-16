const buildDashboardMetricsPayload = (metrics) => {
  const totalSubmissions = Number(metrics?.totalSubmissions ?? 0);
  const totalAiReviews = Number(metrics?.totalAiReviews ?? 0);
  const totalIssuesFound = Number(metrics?.totalIssuesFound ?? 0);
  const averageCyclomaticComplexity = Number(metrics?.averageCyclomaticComplexity ?? 0);
  const complexitySummary = metrics?.complexitySummary ?? { low: 0, medium: 0, high: 0 };
  const latestSubmissions = Array.isArray(metrics?.latestSubmissions) ? metrics.latestSubmissions : [];
  const latestAiReviews = Array.isArray(metrics?.latestAiReviews) ? metrics.latestAiReviews : [];
  const languageDistribution = Array.isArray(metrics?.languageDistribution) ? metrics.languageDistribution : [];

  const reviewCoverage = totalSubmissions > 0 ? Math.round((totalAiReviews / totalSubmissions) * 100) : 0;
  const reviewQuality = totalSubmissions > 0 ? Math.round((totalAiReviews / totalSubmissions) * 100) : 0;
  const releaseReadiness = totalSubmissions > 0 ? Math.max(0, Math.min(100, 100 - Math.min(100, totalIssuesFound * 3))) : 100;

  return {
    success: true,
    metrics: {
      submissions: totalSubmissions,
      aiReviews: totalAiReviews,
      issuesFound: totalIssuesFound,
      averageCyclomaticComplexity: Number(averageCyclomaticComplexity.toFixed(1)),
      reviewCoverage,
      reviewQuality,
      releaseReadiness,
      complexitySummary,
      latestSubmissions,
      latestAiReviews,
      languageDistribution,
      recentSubmissions: latestSubmissions,
    },
  };
};

const getDashboardMetrics = async (pool, userId) => {
  const [metricsResult, submissionsResult, aiReviewsResult, languageResult, complexityResult] = await Promise.all([
    pool.query(
      `SELECT
        COUNT(*)::int AS total_submissions,
        COALESCE(SUM(CASE WHEN COALESCE(NULLIF(ai_review_summary, ''), '') <> '' THEN 1 ELSE 0 END), 0)::int AS total_ai_reviews,
        COALESCE(SUM(COALESCE(issues_found, 0)), 0)::int AS total_issues_found,
        ROUND(AVG(COALESCE(cyclomatic_complexity, 0))::numeric, 2) AS average_cyclomatic_complexity
      FROM submissions
      WHERE user_id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT id, title, language, created_at, ai_review_summary, cyclomatic_complexity
      FROM submissions
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
      LIMIT 5`,
      [userId]
    ),
    pool.query(
      `SELECT id, title, language, created_at, ai_review_summary
      FROM submissions
      WHERE user_id = $1
        AND COALESCE(NULLIF(ai_review_summary, ''), '') <> ''
      ORDER BY COALESCE(ai_review_created_at, created_at) DESC, created_at DESC
      LIMIT 5`,
      [userId]
    ),
    pool.query(
      `SELECT language, COUNT(*)::int AS count
      FROM submissions
      WHERE user_id = $1
      GROUP BY language
      ORDER BY count DESC, language ASC`,
      [userId]
    ),
    pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE COALESCE(cyclomatic_complexity, 0) < 10)::int AS low,
        COUNT(*) FILTER (WHERE COALESCE(cyclomatic_complexity, 0) >= 10 AND COALESCE(cyclomatic_complexity, 0) < 20)::int AS medium,
        COUNT(*) FILTER (WHERE COALESCE(cyclomatic_complexity, 0) >= 20)::int AS high
      FROM submissions
      WHERE user_id = $1`,
      [userId]
    ),
  ]);

  const metricsRow = metricsResult.rows[0] || {};
  const complexityRow = complexityResult.rows[0] || {};

  const latestSubmissions = (submissionsResult.rows || []).map((row) => ({
    id: row.id,
    title: row.title || "Untitled submission",
    language: row.language || "Unknown",
    created_at: row.created_at,
    aiReviewSummary: row.ai_review_summary || "",
    complexity: row.cyclomatic_complexity == null
      ? "Pending"
      : row.cyclomatic_complexity >= 20
        ? "High complexity"
        : row.cyclomatic_complexity >= 10
          ? "Medium complexity"
          : "Low complexity",
  }));

  const latestAiReviews = (aiReviewsResult.rows || []).map((row) => ({
    id: row.id,
    title: row.title || "Untitled submission",
    language: row.language || "Unknown",
    created_at: row.created_at,
    summary: row.ai_review_summary || "",
  }));

  const languageDistribution = (languageResult.rows || []).map((row) => ({
    language: row.language || "Unknown",
    count: Number(row.count || 0),
  }));

  return buildDashboardMetricsPayload({
    totalSubmissions: metricsRow.total_submissions ?? 0,
    totalAiReviews: metricsRow.total_ai_reviews ?? 0,
    totalIssuesFound: metricsRow.total_issues_found ?? 0,
    averageCyclomaticComplexity: metricsRow.average_cyclomatic_complexity ?? 0,
    latestSubmissions,
    latestAiReviews,
    languageDistribution,
    complexitySummary: {
      low: Number(complexityRow.low ?? 0),
      medium: Number(complexityRow.medium ?? 0),
      high: Number(complexityRow.high ?? 0),
    },
  });
};

module.exports = {
  buildDashboardMetricsPayload,
  getDashboardMetrics,
};
