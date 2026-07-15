const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const authMiddleware = require("../middleware/auth.middleware");

const { signup, login, getCurrentUser } = require("../controllers/auth.controller");
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
  "/signup",
  body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  validate,
  asyncHandler(signup)
);
router.post(
  "/login",
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
  asyncHandler(login)
);
router.get("/me", authMiddleware, asyncHandler(getCurrentUser));

module.exports = router;