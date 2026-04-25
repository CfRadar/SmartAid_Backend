const mongoose = require("mongoose");
const Opportunity = require("../models/Opportunity");
const ApiError = require("../utils/ApiError");

function parseNumber(value, fallback = null) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function buildLocationFilter({ longitude, latitude, maxDistanceKm }) {
  const lng = parseNumber(longitude);
  const lat = parseNumber(latitude);

  if (lng === null || lat === null) return {};

  const maxDistance = parseNumber(maxDistanceKm, 10);
  return {
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        $maxDistance: Math.max(1, maxDistance) * 1000
      }
    }
  };
}

async function listOpportunities(filters = {}) {
  const {
    category,
    subCategory,
    urgency,
    status = "open",
    sourceType,
    ngoId,
    page = 1,
    limit = 20,
    longitude,
    latitude,
    maxDistanceKm
  } = filters;

  const query = {};

  if (category) query.category = category;
  if (subCategory) query.subCategory = subCategory;
  if (urgency) query.urgency = urgency;
  if (status) query.status = status;
  if (sourceType) query.sourceType = sourceType;
  if (ngoId && mongoose.Types.ObjectId.isValid(ngoId)) query.ngoId = ngoId;

  Object.assign(query, buildLocationFilter({ longitude, latitude, maxDistanceKm }));

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    Opportunity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate("createdBy", "email")
      .populate("ngoId", "name"),
    Opportunity.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit)
    }
  };
}

async function getNearbyOpportunities({ longitude, latitude, maxDistanceKm = 10, limit = 20 }) {
  const lng = parseNumber(longitude);
  const lat = parseNumber(latitude);

  if (lng === null || lat === null) {
    throw new ApiError(400, "longitude and latitude are required for nearby search");
  }

  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const maxDistance = Math.max(1, parseNumber(maxDistanceKm, 10)) * 1000;

  return Opportunity.find({
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance
      }
    },
    status: { $in: ["open", "ongoing"] }
  })
    .limit(safeLimit)
    .populate("ngoId", "name")
    .populate("createdBy", "email");
}

async function createOpportunity(payload) {
  return Opportunity.create(payload);
}

module.exports = {
  listOpportunities,
  getNearbyOpportunities,
  createOpportunity
};
