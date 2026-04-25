const express = require("express");
const opportunityController = require("../controllers/opportunity.controller");

const router = express.Router();

router.get("/", opportunityController.listOpportunities);
router.get("/nearby", opportunityController.getNearbyOpportunities);

module.exports = router;
