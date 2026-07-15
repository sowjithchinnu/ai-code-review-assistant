require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const requiredEnv = ["JWT_SECRET", "DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);

if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const PORT = Number(process.env.PORT || 8000);

(async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
})();