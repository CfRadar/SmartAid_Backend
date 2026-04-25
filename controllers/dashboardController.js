const asyncHandler = require("../middleware/asyncHandler");
const dashboardService = require("../services/dashboardService");

const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats();

  res.status(200).json({
    success: true,
    ...stats
  });
});

module.exports = {
  getStats
};
