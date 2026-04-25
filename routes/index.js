const express = require("express");

const dashboardRoutes = require("./dashboardRoutes");
const ingestionRoutes = require("./ingestion.routes");
const opportunityRoutes = require("./opportunity.routes");
const reportRoutes = require("./reportRoutes");
const submissionRoutes = require("./submission.routes");
const authRoutes = require("./authRoutes");
const profileRoutes = require("./profileRoutes");
const recommendationRoutes = require("./recommendationRoutes");
const leaderboardRoutes = require("./leaderboardRoutes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Volunteer platform API is healthy"
  });
});

router.use("/dashboard", dashboardRoutes);
router.use("/report", reportRoutes);
router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/recommendations", recommendationRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/", ingestionRoutes);
router.use("/opportunities", opportunityRoutes);
router.use("/submissions", submissionRoutes);

module.exports = router;
router.use("/submissions", submissionRoutes);

module.exports = router;
