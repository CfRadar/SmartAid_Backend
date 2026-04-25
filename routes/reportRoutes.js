const express = require("express");
const reportController = require("../controllers/reportController");

const router = express.Router();

router.post("/", reportController.submitReport);

module.exports = router;
