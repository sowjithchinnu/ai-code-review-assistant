const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const { asyncHandler } = require("../middleware/error.middleware");
const { getDashboardMetricsController } = require("../controllers/dashboard.controller");

router.get("/metrics", authMiddleware, asyncHandler(getDashboardMetricsController));

module.exports = router;
