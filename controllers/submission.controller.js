const asyncHandler = require("../middleware/asyncHandler");
const ingestionService = require("../services/ingestion.service");

const submitRawData = asyncHandler(async (req, res) => {
  const submission = await ingestionService.createSubmission(req.body);

  const autoProcess = req.query.autoProcess !== "false";
  if (!autoProcess) {
    return res.status(201).json({
      success: true,
      submission
    });
  }

  const processed = await ingestionService.processSubmission(submission._id);

  return res.status(201).json({
    success: true,
    ...processed
  });
});

const processSubmission = asyncHandler(async (req, res) => {
  const result = await ingestionService.processSubmission(req.params.id);

  res.status(200).json({
    success: true,
    ...result
  });
});

module.exports = {
  submitRawData,
  processSubmission
};
