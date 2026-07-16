const { getDashboardMetrics } = require("../services/dashboard.service");
const pool = require("../config/db");

const getDashboardMetricsController = async (req, res, next) => {
  try {
    const payload = await getDashboardMetrics(pool, req.user.userId);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetricsController,
};
