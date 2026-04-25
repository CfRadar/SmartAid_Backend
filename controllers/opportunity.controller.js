const asyncHandler = require("../middleware/asyncHandler");
const opportunityService = require("../services/opportunity.service");

const listOpportunities = asyncHandler(async (req, res) => {
  const result = await opportunityService.listOpportunities(req.query);

  res.status(200).json({
    success: true,
    ...result
  });
});

const getNearbyOpportunities = asyncHandler(async (req, res) => {
  const items = await opportunityService.getNearbyOpportunities(req.query);

  res.status(200).json({
    success: true,
    count: items.length,
    items
  });
});

module.exports = {
  listOpportunities,
  getNearbyOpportunities
};
