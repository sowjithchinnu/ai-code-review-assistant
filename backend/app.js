const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth.routes");
const submissionRoutes = require("./routes/submission.routes");
const { errorHandler, notFoundHandler } = require("./middleware/error.middleware");

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
  credentials: true,
}));
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "AI Code Review Assistant API 🚀" });
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;