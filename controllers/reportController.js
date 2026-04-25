const asyncHandler = require("../middleware/asyncHandler");
const reportService = require("../services/reportService");

const submitReport = asyncHandler(async (req, res) => {
  const result = await reportService.createReport(req.body);

  res.status(201).json({
    success: true,
    mode: result.isDraft ? "draft" : "submitted",
    submission: result.submission,
    opportunity: result.opportunity
  });
});

module.exports = {
  submitReport
};
