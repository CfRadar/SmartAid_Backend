const asyncHandler = require("../middleware/asyncHandler");
const ingestionService = require("../services/ingestionService");

const runIngestion = asyncHandler(async (req, res) => {
  const stats = await ingestionService.runWebIngestion();

  res.status(200).json({
    success: true,
    stats
  });
});

const getSubmissions = asyncHandler(async (req, res) => {
  const items = await ingestionService.listSubmissions();

  res.status(200).json({
    success: true,
    count: items.length,
    items
  });
});

const getOpportunities = asyncHandler(async (req, res) => {
  const items = await ingestionService.listOpportunities();

  res.status(200).json({
    success: true,
    count: items.length,
    items
  });
});

module.exports = {
  runIngestion,
  getSubmissions,
  getOpportunities
};
