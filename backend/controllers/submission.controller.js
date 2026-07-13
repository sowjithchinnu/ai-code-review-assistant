const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const {
  analyzeJavaScript,
  analyzePython,
} = require("../services/static-analysis.service");

const CACHE_DIR = path.join(__dirname, "../cache");

function saveAnalysisCache(userId, analysis) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  const issues = Array.isArray(analysis) ? analysis : [];

  fs.writeFileSync(
    path.join(CACHE_DIR, `analysis-${userId}.json`),
    JSON.stringify({ analysis: issues })
  );
}

const createSubmission = async (req, res) => {
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

    if (req.file) {
      const normalizedLanguage = language.trim().toLowerCase();

      if (normalizedLanguage === "javascript" || normalizedLanguage === "js") {
        analysis = await analyzeJavaScript(req.file.path);
      } else if (normalizedLanguage === "python" || normalizedLanguage === "py") {
        analysis = await analyzePython(req.file.path);
      }

      saveAnalysisCache(req.user.userId, analysis);
    }

    res.status(201).json({
      success: true,
      submission: result.rows[0],
      analysis,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getAnalysis = async (req, res) => {
  try {
    const cachePath = path.join(CACHE_DIR, `analysis-${req.user.userId}.json`);

    if (!fs.existsSync(cachePath)) {
      return res.json({
        success: true,
        analysis: [],
      });
    }

    const { analysis } = JSON.parse(fs.readFileSync(cachePath, "utf8"));

    res.json({
      success: true,
      analysis: Array.isArray(analysis) ? analysis : [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = { createSubmission, getAnalysis };