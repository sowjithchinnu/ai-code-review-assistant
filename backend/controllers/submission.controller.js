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

    const result = await pool.query(
      `INSERT INTO submissions (user_id, title, language, code, file_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.userId, title, language, code, fileName]
    );

    let analysis = [];

    let formattingIssues = [];

    if (req.file) {
      const normalizedLanguage = language.trim().toLowerCase();
      let analysisResult = { issues: [], formattingIssues: [] };

      if (normalizedLanguage === "javascript" || normalizedLanguage === "js") {
        analysisResult = await analyzeJavaScript(req.file.path);
      } else if (normalizedLanguage === "python" || normalizedLanguage === "py") {
        analysisResult = await analyzePython(req.file.path);
      }

      analysis = Array.isArray(analysisResult.issues)
        ? analysisResult.issues
        : [];
      formattingIssues = Array.isArray(analysisResult.formattingIssues)
        ? analysisResult.formattingIssues
        : [];
    }

    const aiReview = await generateAIReview(code, language, analysis);
    const documentation = await generateDocumentation(code, language);

    const complexityReport = req.file
      ? await analyzeComplexity(req.file.path)
      : null;

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

    if (req.file) {
      const analysisResult = {
        issues: analysis,
        formattingIssues,
        styleIssues: styleReport,
        duplicateCodeReport,
      };

      saveAnalysisCache(req.user.userId, analysisResult);
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

    const clauses = [];
    const values = [req.user.userId];
    const countValues = [req.user.userId];
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

module.exports = { createSubmission, getAnalysis, getSubmissions };