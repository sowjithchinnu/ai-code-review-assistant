const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const submissionRoutes = require("./routes/submission.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/submissions", submissionRoutes);

app.get("/", (req, res) => {
  res.json({ message: "AI Code Review Assistant API 🚀" });
});

module.exports = app;