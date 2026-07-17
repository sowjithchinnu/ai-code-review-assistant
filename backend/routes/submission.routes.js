const express = require("express");
const router = express.Router();
const { body, query, validationResult } = require("express-validator");

const authMiddleware = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const {
  createSubmission,
  getAnalysis,
  getSubmissions,
  deleteSubmission,
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
  query("date").optional().custom((value) => {
    // Allow either YYYY-MM-DD format or 'oldest' sort order, but not other values
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value) && value !== "oldest" && value !== "newest") {
      throw new Error("Date must be in YYYY-MM-DD format or 'oldest'/'newest' for sort order");
    }
    return true;
  }).withMessage("Invalid date format"),
  validate,
  asyncHandler(getSubmissions)
);
router.get("/analysis", authMiddleware, asyncHandler(getAnalysis));
router.delete("/:id", authMiddleware, asyncHandler(deleteSubmission));

module.exports = router;