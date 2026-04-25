const express = require("express");
const ingestionController = require("../controllers/ingestion.controller");

const router = express.Router();

router.get("/ingest", ingestionController.runIngestion);
router.get("/submissions", ingestionController.getSubmissions);

module.exports = router;
