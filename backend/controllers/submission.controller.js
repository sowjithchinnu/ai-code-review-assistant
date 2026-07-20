const fs = require("fs");
const os = require("os");
const path = require("path");
const pool = require("../config/db");
const {
  analyzeJavaScript,
  analyzePython,
} = require("../services/static-analysis.service");

const {
  analyzeComplexity,
} = require("../services/complexity-analysis.service");

const {
  generateDocumentation,
} = require("../services/documentation.service");

const { generateAIReview } = require("../services/ai-review.service");

const CACHE_DIR = path.join(__dirname, "../cache");

function removeAnalysisCache(userId) {
  if (!fs.existsSync(CACHE_DIR)) {
    return;
  }

  const cachePath = path.join(CACHE_DIR, `analysis-${userId}.json`);
  if (fs.existsSync(cachePath)) {
    try {
      fs.unlinkSync(cachePath);
    } catch (error) {
      console.error(`Failed to remove cache for user ${userId}:`, error.message);
    }
  }
}

function getStyleIssues(issues) {
  const styleRules = new Set([
    "semi",
    "quotes",
    "eqeqeq",
    "curly",
    "indent",
    "no-console",
    "no-var",
    "prefer-const",
  ]);

  return Array.isArray(issues)
    ? issues.filter((issue) => styleRules.has(issue.rule))
    : [];
}

function saveAnalysisCache(userId, analysisData) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const issues = Array.isArray(analysisData)
    ? analysisData
    : Array.isArray(analysisData?.issues)
    ? analysisData.issues
    : [];
  const formattingIssues = Array.isArray(analysisData?.formattingIssues)
    ? analysisData.formattingIssues
    : [];
  const styleIssues = getStyleIssues(issues);

  fs.writeFileSync(
    path.join(CACHE_DIR, `analysis-${userId}.json`),
    JSON.stringify({ analysis: issues, formattingIssues, styleIssues, duplicateCodeReport: analysisData.duplicateCodeReport || { duplicatePercentage: 0, duplicatedBlocks: 0, duplicatedLines: 0 } })
  );
}

const createSubmission = async (req, res, next) => {
  try {
    const { title, language, code: bodyCode } = req.body;

    let code;
    let fileName = null;

    if (req.file) {
      code = fs.readFileSync(req.file.path, "utf8");
      fileName = req.file.originalname;
    } else {
      code = bodyCode;
    }

    if (!title || !language || !code) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const userId = Number(req.user?.userId ?? req.user?.id ?? req.user?.user_id);
    if (!userId || Number.isNaN(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    const userRecord = await pool.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (userRecord.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found.",
      });
    }

    const result = await pool.query(
      `INSERT INTO submissions (user_id, title, language, code, file_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, title, language, code, fileName]
    );

    let analysis = [];
    let formattingIssues = [];
    let complexityReport = null;
    const normalizedLanguage = language.trim().toLowerCase();
    let tempFilePath = null;

    if (req.file) {
      const filePath = req.file.path;
      const analysisResult =
        normalizedLanguage === "javascript" || normalizedLanguage === "js"
          ? await analyzeJavaScript(filePath)
          : normalizedLanguage === "python" || normalizedLanguage === "py"
          ? await analyzePython(filePath)
          : { issues: [], formattingIssues: [] };

      analysis = Array.isArray(analysisResult.issues) ? analysisResult.issues : [];
      formattingIssues = Array.isArray(analysisResult.formattingIssues)
        ? analysisResult.formattingIssues
        : [];
      complexityReport = await analyzeComplexity(filePath);
    } else {
      const extensionMap = {
        javascript: ".js",
        js: ".js",
        typescript: ".ts",
        ts: ".ts",
        python: ".py",
        py: ".py",
        java: ".java",
        go: ".go",
        rust: ".rs",
        cpp: ".cpp",
        c: ".c",
      };
      const extension = extensionMap[normalizedLanguage] || ".txt";
      tempFilePath = path.join(os.tmpdir(), `submission-${Date.now()}${Math.random().toString(36).slice(2)}${extension}`);
      fs.writeFileSync(tempFilePath, code, "utf8");

      const analysisResult =
        normalizedLanguage === "javascript" || normalizedLanguage === "js"
          ? await analyzeJavaScript(tempFilePath)
          : normalizedLanguage === "python" || normalizedLanguage === "py"
          ? await analyzePython(tempFilePath)
          : { issues: [], formattingIssues: [] };

      analysis = Array.isArray(analysisResult.issues) ? analysisResult.issues : [];
      formattingIssues = Array.isArray(analysisResult.formattingIssues)
        ? analysisResult.formattingIssues
        : [];
      complexityReport = await analyzeComplexity(tempFilePath);
    }

    const duplicateCodeReport = complexityReport
      ? {
          duplicatePercentage: complexityReport.duplicatePercentage ?? 0,
          duplicatedBlocks: complexityReport.duplicatedBlocks ?? 0,
          duplicatedLines: complexityReport.duplicatedLines ?? 0,
        }
      : {
          duplicatePercentage: 0,
          duplicatedBlocks: 0,
          duplicatedLines: 0,
        };

    const styleReport = getStyleIssues(analysis);
    const reviewSummary = typeof aiReview?.summary === "string" ? aiReview.summary : "";
    const complexityValue = complexityReport?.cyclomaticComplexity ?? null;
    const issueCount = Array.isArray(analysis) ? analysis.length : 0;

    // Save analysis cache for both file uploads and pasted code
    const analysisResult = {
      issues: analysis,
      formattingIssues,
      styleIssues: styleReport,
      duplicateCodeReport,
    };

    saveAnalysisCache(req.user.userId, analysisResult);

    await pool.query(
      `UPDATE submissions
       SET ai_review_summary = $1,
           cyclomatic_complexity = $2,
           issues_found = $3,
           ai_review_created_at = NOW()
       WHERE id = $4`,
      [reviewSummary, complexityValue, issueCount, result.rows[0].id]
    );

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.warn(`Failed to remove temp submission file: ${cleanupError.message}`);
      }
    }

    res.status(201).json({
      success: true,
      submission: result.rows[0],
      analysis,
      aiReview,
      complexityReport,
      duplicateCodeReport,
      formattingReport: formattingIssues,
      styleReport,
      documentation,
    });

  } catch (error) {
    next(error);
  }
};

const getAnalysis = async (req, res, next) => {
  try {
    const cachePath = path.join(CACHE_DIR, `analysis-${req.user.userId}.json`);

    if (!fs.existsSync(cachePath)) {
      return res.json({
        success: true,
        analysis: [],
      });
    }

    const data = JSON.parse(fs.readFileSync(cachePath, "utf8"));

    res.json({
      success: true,
      analysis: Array.isArray(data.analysis) ? data.analysis : [],
      formattingReport: Array.isArray(data.formattingIssues)
        ? data.formattingIssues
        : [],
      styleReport: Array.isArray(data.styleIssues) ? data.styleIssues : [],
      duplicateCodeReport: data.duplicateCodeReport || {
        duplicatePercentage: 0,
        duplicatedBlocks: 0,
        duplicatedLines: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSubmissions = async (req, res, next) => {
  try {
    const { search = "", language = "", date = "", page = "1", limit = "10" } = req.query;

    const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
    const parsedLimit = Math.min(25, Math.max(1, Number.parseInt(String(limit), 10) || 10));
    const offset = (parsedPage - 1) * parsedLimit;

    const userId = Number(req.user?.userId ?? req.user?.id ?? req.user?.user_id);
    if (!userId || Number.isNaN(userId)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    const clauses = [];
    const values = [userId];
    const countValues = [userId];
    let index = 2;

    if (search) {
      const searchValue = `%${String(search).toLowerCase()}%`;
      clauses.push(`(LOWER(title) LIKE $${index} OR LOWER(language) LIKE $${index})`);
      values.push(searchValue);
      countValues.push(searchValue);
      index += 1;
    }

    if (language) {
      const languageValue = String(language).toLowerCase();
      clauses.push(`LOWER(language) = $${index}`);
      values.push(languageValue);
      countValues.push(languageValue);
      index += 1;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      const dateValue = String(date);
      clauses.push(`DATE(created_at) = $${index}`);
      values.push(dateValue);
      countValues.push(dateValue);
      index += 1;
    }

    const whereClause = clauses.length > 0 ? ` AND ${clauses.join(" AND ")}` : "";
    const sortDirection = date === "oldest" ? "ASC" : "DESC";

    const query = `SELECT id, title, language, code, created_at FROM submissions WHERE user_id = $1${whereClause} ORDER BY created_at ${sortDirection} LIMIT $${index} OFFSET $${index + 1}`;
    const countQuery = `SELECT COUNT(*)::int AS total FROM submissions WHERE user_id = $1${whereClause}`;

    values.push(parsedLimit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, countValues),
    ]);

    const submissions = await Promise.all(
      result.rows.map(async (row) => {
        let aiReviewSummary = "";
        let complexity = "Unavailable";

        if (row.code) {
          const reviewResult = await generateAIReview(row.code, row.language, []);
          if (reviewResult?.success) {
            aiReviewSummary = reviewResult.summary || "";
          } else {
            aiReviewSummary = reviewResult?.message || "AI review unavailable";
          }

          const extension = String(row.language || "js")
            .trim()
            .toLowerCase()
            .includes("python")
            ? "py"
            : "js";
          const tempFilePath = path.join(
            os.tmpdir(),
            `submission-${row.id}-${Date.now()}.${extension}`
          );

          try {
            fs.writeFileSync(tempFilePath, row.code, "utf8");
            const complexityReport = await analyzeComplexity(tempFilePath);
            if (complexityReport?.success) {
              complexity = complexityReport.complexity || "Unknown";
            }
          } catch (error) {
            // Complexity analysis failures should not break the history response
          } finally {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
          }
        }

        return {
          id: row.id,
          title: row.title,
          language: row.language,
          code: row.code,
          created_at: row.created_at,
          aiReviewSummary,
          complexity,
        };
      })
    );

    const totalCount = Number(countResult.rows[0]?.total || 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / parsedLimit));

    res.json({
      success: true,
      submissions,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        totalCount,
        totalPages,
        hasNextPage: parsedPage < totalPages,
        hasPrevPage: parsedPage > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteSubmissionRecord = async ({ pool, userId, submissionId, removeCache }) => {
  const result = await pool.query(
    `DELETE FROM submissions WHERE id = $1 AND user_id = $2 RETURNING id`,
    [submissionId, userId]
  );

  if (result.rowCount === 0) {
    return {
      success: false,
      deleted: false,
      message: "Submission not found or does not belong to the current user",
    };
  }

  const remainingResult = await pool.query(
    `SELECT id FROM submissions WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  if (remainingResult.rowCount === 0) {
    removeCache(userId);
  }

  return {
    success: true,
    deleted: true,
    message: "Submission deleted successfully",
  };
};

const deleteSubmission = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Submission ID is required",
      });
    }

    const result = await deleteSubmissionRecord({
      pool,
      userId: req.user.userId,
      submissionId: parseInt(id, 10),
      removeCache: removeAnalysisCache,
    });

    return res.status(result.deleted ? 200 : 404).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { createSubmission, getAnalysis, getSubmissions, deleteSubmission, deleteSubmissionRecord };