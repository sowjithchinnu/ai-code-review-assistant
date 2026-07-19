require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const requiredEnv = [
  "DATABASE_URL",
  "JWT_SECRET",
  "GROQ_API_KEY",
];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const PORT = Number(process.env.PORT || 8000);

const ensureSubmissionColumns = async () => {
  const statements = [
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_review_summary TEXT",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS cyclomatic_complexity NUMERIC(6,2)",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS issues_found INT DEFAULT 0",
    "ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ai_review_created_at TIMESTAMP",
  ];

  for (const statement of statements) {
    await pool.query(statement);
  }
};

(async () => {
  try {
    await pool.query("SELECT NOW()");
    await ensureSubmissionColumns();
    console.log("✅ PostgreSQL Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
})();