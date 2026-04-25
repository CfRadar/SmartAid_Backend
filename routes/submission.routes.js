const express = require("express");
const submissionController = require("../controllers/submission.controller");

const router = express.Router();

router.post("/", submissionController.submitRawData);
router.post("/:id/process", submissionController.processSubmission);

module.exports = router;
