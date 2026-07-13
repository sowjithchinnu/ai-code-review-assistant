const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const {
  createSubmission,
} = require("../controllers/submission.controller");

router.post("/", authMiddleware, upload.single("file"), createSubmission);

module.exports = router;