const express = require("express");

const opportunityRoutes = require("./opportunity.routes");
const submissionRoutes = require("./submission.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Volunteer platform API is healthy"
  });
});

router.use("/opportunities", opportunityRoutes);
router.use("/submissions", submissionRoutes);

module.exports = router;
