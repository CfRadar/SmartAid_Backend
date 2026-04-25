const Opportunity = require("../models/Opportunity");
const Submission = require("../models/Submission");
const ApiError = require("../utils/ApiError");

function normalizeInput(payload = {}) {
  return {
    title: String(payload.title || "").trim(),
    description: String(payload.description || "").trim(),
    category: payload.category || "general",
    urgency: payload.urgency || "medium",
    peopleAffected: Number(payload.peopleAffected) || 0,
    locationAddress: String(payload.location?.address || "").trim() || "Not specified",
    status: payload.status === "draft" ? "draft" : "submitted"
  };
}

async function createReport(payload) {
  const normalized = normalizeInput(payload);

  if (!normalized.title || !normalized.description) {
    throw new ApiError(400, "title and description are required");
  }

  const submission = await Submission.create({
    type: "form",
    rawData: payload,
    parsedData: {
      title: normalized.title,
      description: normalized.description,
      category: normalized.category,
      urgency: normalized.urgency,
      peopleAffected: normalized.peopleAffected,
      locationAddress: normalized.locationAddress,
      reportStatus: normalized.status
    },
    processingStatus: "pending"
  });

  if (normalized.status === "draft") {
    submission.processingStatus = "processed";
    submission.errorMessage = undefined;
    await submission.save();

    return {
      isDraft: true,
      submission,
      opportunity: null
    };
  }

  const opportunity = await Opportunity.create({
    title: normalized.title,
    description: normalized.description,
    category: normalized.category,
    urgency: normalized.urgency,
    sourceType: "user",
    sourceDetails: {
      name: "user"
    },
    location: {
      type: "Point",
      coordinates: [0, 0],
      address: normalized.locationAddress,
      rawText: normalized.locationAddress
    },
    impact: {
      peopleAffected: normalized.peopleAffected
    },
    status: "open"
  });

  submission.processingStatus = "processed";
  submission.linkedOpportunityId = opportunity._id;
  submission.errorMessage = undefined;
  await submission.save();

  return {
    isDraft: false,
    submission,
    opportunity
  };
}

module.exports = {
  createReport
};
