const Opportunity = require("../models/Opportunity");
const Submission = require("../models/Submission");
const ApiError = require("../utils/ApiError");
const { parseLocation } = require("../utils/locationParser");
const { detectCategory } = require("../utils/aiClassifier");

function normalizeInput(payload = {}) {
  const desc = String(payload.description || "").trim();
  const addressSource = payload.location?.address || desc;
  const parsedLoc = parseLocation(addressSource).address;

  return {
    title: String(payload.title || "").trim(),
    description: desc,
    category: payload.category || detectCategory(desc) || "general",
    urgency: payload.urgency || "medium",
    peopleAffected: Number(payload.peopleAffected) || 0,
    locationAddress: Buffer.from(parsedLoc, "utf-8").length > 0 ? parsedLoc : "Not specified",
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
    location: parseLocation(normalized.locationAddress),
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
