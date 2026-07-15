const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const {
  createSubmission,
  getAnalysis,
  getSubmissions,
} = require("../controllers/submission.controller");

router.post("/", authMiddleware, upload.single("file"), createSubmission);
router.get("/", authMiddleware, getSubmissions);
router.get("/analysis", authMiddleware, getAnalysis);

module.exports = router;