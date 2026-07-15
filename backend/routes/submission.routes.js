const express = require("express");
const router = express.Router();
const { body, query, validationResult } = require("express-validator");

const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const {
  createSubmission,
  getAnalysis,
  getSubmissions,
} = require("../controllers/submission.controller");
const { asyncHandler } = require("../middleware/error.middleware");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
    });
  }

  next();
};

router.post(
  "/",
  authMiddleware,
  upload,
  body("title").trim().isLength({ min: 1 }).withMessage("Title is required"),
  body("language").trim().isLength({ min: 1 }).withMessage("Language is required"),
  validate,
  asyncHandler(createSubmission)
);
router.get(
  "/",
  authMiddleware,
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 25 }).withMessage("Limit must be between 1 and 25"),
  query("date").optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Date must be in YYYY-MM-DD format"),
  validate,
  asyncHandler(getSubmissions)
);
router.get("/analysis", authMiddleware, asyncHandler(getAnalysis));

module.exports = router;