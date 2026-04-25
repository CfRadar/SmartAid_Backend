const crypto = require("crypto");
const pLimit = require("p-limit");

const Opportunity = require("../models/Opportunity");
const Submission = require("../models/Submission");
const { parseSearchResult } = require("../utils/parser");
const webSearchService = require("./webSearchService");

const DEFAULT_CONCURRENCY = Math.max(1, Number(process.env.INGESTION_CONCURRENCY || 4));
const MIN_QUALITY_SCORE = 2;
const COMPLETION_PATTERN = /\b(completed|successfully\s+done)\b/i;

function buildLocation(locationText) {
  return {
    type: "Point",
    coordinates: [0, 0],
    address: locationText || "Not specified",
    rawText: locationText || ""
  };
}

function normalizeForHash(value = "") {
  return String(value).toLowerCase().replace(/\s+/g, " ").trim();
}

function generateContentHash(parsed) {
  const hashInput = [parsed.title, parsed.description, parsed.address].map(normalizeForHash).join("|");
  return crypto.createHash("sha256").update(hashInput).digest("hex");
}

function escapeRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function levenshteinDistance(a = "", b = "") {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  return dp[m][n];
}

function similarityScore(a = "", b = "") {
  const left = normalizeForHash(a);
  const right = normalizeForHash(b);
  if (!left || !right) return 0;
  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) return 1;
  const distance = levenshteinDistance(left, right);
  return 1 - distance / maxLength;
}

function isValidParsedOpportunity(parsed) {
  const hasTitle = Boolean(parsed.title);
  const hasDescription = Boolean(parsed.description);

  if (!hasTitle) return { valid: false, reason: "Missing title" };
  if (!hasDescription) return { valid: false, reason: "Description is too short" };

  return { valid: true };
}

function computeDataQualityScore(parsed) {
  let score = 0;

  if (parsed.address && parsed.address !== "Not specified") score += 2;
  if (parsed.contact?.phone) score += 2;
  if (parsed.contact?.email) score += 2;
  if (parsed.peopleAffected > 0) score += 1;
  if (parsed.category) score += 1;

  return score;
}

async function findExistingOpportunity(parsed, contentHash) {
  const byHash = await Opportunity.findOne({ contentHash });
  if (byHash) return byHash;

  if (!parsed.title || !parsed.address) return null;

  const titleTokens = normalizeForHash(parsed.title).split(" ").filter(Boolean).slice(0, 4);
  if (!titleTokens.length) return null;

  const titlePattern = titleTokens.join(".*");
  const titleRegex = new RegExp(titlePattern, "i");

  const candidates = await Opportunity.find({
    title: { $regex: titleRegex },
    sourceType: "web"
  })
    .select("title location.address")
    .limit(30);

  const parsedAddress = normalizeForHash(parsed.address);
  const parsedTitle = normalizeForHash(parsed.title);

  return (
    candidates.find((candidate) => {
      const existingAddress = normalizeForHash(candidate.location?.address || "");
      const existingTitle = normalizeForHash(candidate.title || "");

      const isTitleClose =
        existingTitle.includes(parsedTitle.slice(0, Math.min(parsedTitle.length, 40))) ||
        parsedTitle.includes(existingTitle.slice(0, Math.min(existingTitle.length, 40))) ||
        similarityScore(existingTitle, parsedTitle) >= 0.72;

      const isAddressClose =
        existingAddress.includes(parsedAddress) ||
        parsedAddress.includes(existingAddress) ||
        similarityScore(existingAddress, parsedAddress) >= 0.7;

      return isTitleClose && isAddressClose;
    }) || null
  );
}

function buildOpportunityPayload(parsed, location, contentHash) {
  const completionDetected = COMPLETION_PATTERN.test(parsed.description || "");

  return {
    title: parsed.title,
    description: parsed.description,
    category: parsed.category,
    urgency: parsed.urgency,
    sourceType: "web",
    sourceDetails: {
      name: "web",
      url: parsed.url,
      externalId: parsed.url
    },
    contentHash,
    location,
    contact: {
      phone: parsed.contact?.phone || null,
      email: parsed.contact?.email || null,
      sourceText: parsed.contact?.sourceText || parsed.description
    },
    impact: {
      peopleAffected: parsed.peopleAffected,
      severityScore: parsed.urgency === "high" ? 80 : parsed.urgency === "medium" ? 55 : 30
    },
    verification: {
      isVerified: false,
      confidenceScore: parsed.confidenceScore
    },
    status: completionDetected ? "completed" : "open",
    tags: [parsed.category, parsed.urgency, "web-ingested"]
  };
}

async function processSingleResult(result) {
  const sourceUrl = result?.link;

  if (!sourceUrl) {
    return { outcome: "failed", reason: "Missing source URL" };
  }

  let submission;
  try {
    submission = await Submission.create({
      type: "web",
      rawData: result,
      sourceMeta: {
        url: sourceUrl,
        scrapedAt: new Date(),
        apiUsed: "serpapi"
      },
      processingStatus: "pending"
    });
  } catch (error) {
    return { outcome: "failed", reason: error.message };
  }

  try {
    let parsedResult;
    try {
      parsedResult = parseSearchResult(result);
    } catch (parseError) {
      throw new Error(`Parser failure: ${parseError.message}`);
    }

    if (!parsedResult.valid) {
      throw new Error(parsedResult.reason);
    }

    const { parsed } = parsedResult;

    const qualityValidation = isValidParsedOpportunity(parsed);
    if (!qualityValidation.valid) {
      throw new Error(qualityValidation.reason);
    }

    const dataQualityScore = computeDataQualityScore(parsed);

    console.log({
      title: parsed.title,
      address: parsed.address || "Not specified",
      phone: parsed.contact?.phone || null,
      email: parsed.contact?.email || null,
      score: dataQualityScore
    });

    if (dataQualityScore < MIN_QUALITY_SCORE) {
      const reason = `Low quality score: ${dataQualityScore}`;
      console.log({
        title: parsed.title,
        address: parsed.address || "Not specified",
        phone: parsed.contact?.phone || null,
        email: parsed.contact?.email || null,
        score: dataQualityScore,
        reason
      });

      submission.processingStatus = "processed";
      submission.parsedData = { ...parsed, contentHash: null, dataQualityScore };
      submission.linkedOpportunityId = undefined;
      submission.errorMessage = reason;
      await submission.save();

      return { outcome: "skipped", reason };
    }

    const location = buildLocation(parsed.address || parsed.locationText || "");
    const contentHash = generateContentHash(parsed);

    const existingOpportunity = await findExistingOpportunity(parsed, contentHash);

    if (existingOpportunity) {
      existingOpportunity.description = parsed.description;
      existingOpportunity.urgency = parsed.urgency;
      existingOpportunity.contentHash = contentHash;
      existingOpportunity.contact = {
        phone: parsed.contact?.phone || existingOpportunity.contact?.phone || null,
        email: parsed.contact?.email || existingOpportunity.contact?.email || null,
        sourceText: parsed.contact?.sourceText || parsed.description
      };
      existingOpportunity.location = {
        ...(existingOpportunity.location?.toObject ? existingOpportunity.location.toObject() : existingOpportunity.location),
        type: "Point",
        coordinates: [0, 0],
        address: location.address,
        rawText: location.rawText
      };
      existingOpportunity.impact = {
        ...(existingOpportunity.impact?.toObject ? existingOpportunity.impact.toObject() : existingOpportunity.impact),
        peopleAffected: parsed.peopleAffected
      };
      existingOpportunity.sourceDetails = {
        ...(existingOpportunity.sourceDetails?.toObject
          ? existingOpportunity.sourceDetails.toObject()
          : existingOpportunity.sourceDetails),
        name: "web",
        url: parsed.url,
        externalId: parsed.url
      };
      existingOpportunity.verification = {
        ...(existingOpportunity.verification?.toObject
          ? existingOpportunity.verification.toObject()
          : existingOpportunity.verification),
        confidenceScore: parsed.confidenceScore
      };
      if (COMPLETION_PATTERN.test(parsed.description || "")) {
        existingOpportunity.status = "completed";
      }
      existingOpportunity.updatedAt = new Date();

      await existingOpportunity.save();

      submission.processingStatus = "processed";
      submission.parsedData = { ...parsed, contentHash, dataQualityScore };
      submission.linkedOpportunityId = existingOpportunity._id;
      submission.errorMessage = undefined;
      await submission.save();

      return { outcome: "updated", opportunityId: existingOpportunity._id };
    }

    const payload = buildOpportunityPayload(parsed, location, contentHash);
    const opportunity = await Opportunity.create(payload);

    submission.processingStatus = "processed";
    submission.parsedData = { ...parsed, contentHash, dataQualityScore };
    submission.linkedOpportunityId = opportunity._id;
    submission.errorMessage = undefined;
    await submission.save();

    return { outcome: "created", opportunityId: opportunity._id };
  } catch (error) {
    console.log({
      title: result?.title || "Unknown title",
      address: "Not specified",
      phone: null,
      email: null,
      score: 0,
      reason: error.message
    });

    submission.processingStatus = "failed";
    submission.errorMessage = error.message;
    await submission.save();

    return { outcome: "failed", reason: error.message };
  }
}

async function runWebIngestion(queries) {
  const concurrency = DEFAULT_CONCURRENCY;

  const stats = {
    totalFetched: 0,
    submissionsProcessed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0
  };

  const results = await webSearchService.fetchOrganicResults(queries);
  stats.totalFetched = results.length;

  const limiter = pLimit(concurrency);

  const processed = await Promise.all(
    results.map((item) =>
      limiter(async () => {
        try {
          return await processSingleResult(item);
        } catch (error) {
          return { outcome: "failed", reason: error.message };
        }
      })
    )
  );

  for (const item of processed) {
    stats.submissionsProcessed += 1;
    if (item.outcome === "created") stats.created += 1;
    else if (item.outcome === "updated") stats.updated += 1;
    else if (item.outcome === "skipped") stats.skipped += 1;
    else stats.failed += 1;
  }

  console.log(
    `[INGESTION] fetched=${stats.totalFetched} submissionsProcessed=${stats.submissionsProcessed} created=${stats.created} updated=${stats.updated} skipped=${stats.skipped} failed=${stats.failed}`
  );

  return stats;
}

async function listSubmissions() {
  return Submission.find({}).sort({ createdAt: -1 }).limit(500);
}

async function listOpportunities() {
  return Opportunity.find({}).sort({ createdAt: -1 }).limit(500);
}

module.exports = {
  runWebIngestion,
  listSubmissions,
  listOpportunities
};
