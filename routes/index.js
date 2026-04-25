const express = require("express");

const dashboardRoutes = require("./dashboardRoutes");
const ingestionRoutes = require("./ingestion.routes");
const opportunityRoutes = require("./opportunity.routes");
const reportRoutes = require("./reportRoutes");
const submissionRoutes = require("./submission.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Volunteer platform API is healthy"
  });
});

router.use("/dashboard", dashboardRoutes);
router.use("/report", reportRoutes);
router.use("/", ingestionRoutes);
router.use("/opportunities", opportunityRoutes);
router.use("/submissions", submissionRoutes);

module.exports = router;
