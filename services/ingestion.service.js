const Submission = require("../models/Submission");
const Opportunity = require("../models/Opportunity");
const ApiError = require("../utils/ApiError");

function detectSourceType(submissionType, parsedData) {
  if (parsedData && parsedData.sourceType) return parsedData.sourceType;
  if (submissionType === "web") return "web";
  return submissionType === "form" ? "user" : "ngo";
}

function normalizeOpportunityData(submission) {
  const source = submission.parsedData || submission.rawData || {};

  const coordinates = source.location?.coordinates || source.coordinates || [77.5946, 12.9716];
  const [lng, lat] = coordinates;

  return {
    title: source.title || source.name || "Untitled Opportunity",
    description: source.description || source.details || "No description available",
    category: source.category || "general",
    subCategory: source.subCategory || source.subcategory,
    urgency: source.urgency || "medium",
    sourceType: detectSourceType(submission.type, source),
    sourceDetails: {
      name: source.sourceDetails?.name || source.sourceName,
      url: submission.sourceMeta?.url || source.sourceDetails?.url,
      externalId: source.sourceDetails?.externalId || source.externalId
    },
    location: {
      type: "Point",
      coordinates: [Number(lng), Number(lat)],
      address: source.location?.address,
      city: source.location?.city,
      state: source.location?.state,
      country: source.location?.country,
      pincode: source.location?.pincode
    },
    contact: {
      name: source.contact?.name,
      phone: source.contact?.phone,
      email: source.contact?.email
    },
    requirements: {
      peopleNeeded: source.requirements?.peopleNeeded || 1,
      skillsRequired: source.requirements?.skillsRequired || [],
      resourcesNeeded: source.requirements?.resourcesNeeded || []
    },
    impact: {
      peopleAffected: source.impact?.peopleAffected || 0,
      severityScore: source.impact?.severityScore || 0
    },
    schedule: {
      startTime: source.schedule?.startTime,
      endTime: source.schedule?.endTime,
      isFlexible: source.schedule?.isFlexible ?? true
    },
    duration: source.duration,
    media: {
      images: source.media?.images || [],
      documents: source.media?.documents || []
    },
    status: source.status || "open",
    verification: {
      isVerified: source.verification?.isVerified || false,
      verifiedBy: source.verification?.verifiedBy,
      confidenceScore: source.verification?.confidenceScore || 0
    },
    participants: source.participants || [],
    tags: source.tags || [],
    createdBy: submission.createdBy,
    ngoId: source.ngoId || null
  };
}

async function createSubmission(payload) {
  return Submission.create(payload);
}

async function processSubmission(submissionId) {
  const submission = await Submission.findById(submissionId);

  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }

  if (submission.processingStatus === "processed" && submission.linkedOpportunityId) {
    return {
      submission,
      opportunity: await Opportunity.findById(submission.linkedOpportunityId)
    };
  }

  try {
    const normalized = normalizeOpportunityData(submission);
    const opportunity = await Opportunity.create(normalized);

    submission.processingStatus = "processed";
    submission.linkedOpportunityId = opportunity._id;
    await submission.save();

    return { submission, opportunity };
  } catch (error) {
    submission.processingStatus = "failed";
    await submission.save();

    throw new ApiError(422, "Failed to process submission", error.message);
  }
}

module.exports = {
  createSubmission,
  processSubmission,
  normalizeOpportunityData
};
