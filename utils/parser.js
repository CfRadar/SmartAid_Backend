const CATEGORY_KEYWORDS = {
  food: ["food", "meal", "hunger", "ration", "feeding"],
  education: ["education", "school", "student", "books", "teaching"],
  medical: ["medical", "health", "hospital", "medicine", "blood", "clinic"],
  disaster: ["flood", "earthquake", "cyclone", "disaster", "relief", "emergency"]
};

const URGENCY_KEYWORDS = ["urgent", "immediate", "asap", "critical", "emergency"];
const KNOWN_LOCATIONS = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Bangalore",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Surat",
  "Kanpur",
  "Patna",
  "Bhopal",
  "India"
];

function normalizeWhitespace(text = "") {
  return text.replace(/\s+/g, " ").trim();
}

function isValidHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function inferCategory(text = "") {
  const haystack = text.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return { value: category, detected: true };
    }
  }

  return { value: "general", detected: false };
}

function inferUrgency(text = "") {
  const haystack = text.toLowerCase();

  if (URGENCY_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return { value: "high", detected: true };
  }

  if (haystack.includes("soon") || haystack.includes("priority")) {
    return { value: "medium", detected: true };
  }

  return { value: "low", detected: false };
}

function extractPeopleAffected(text = "") {
  const numberMatches = [...text.matchAll(/\b(\d{1,6})\+?\b/g)];
  if (!numberMatches.length) return 0;

  const values = numberMatches.map((match) => Number(match[1])).filter((value) => Number.isFinite(value));
  if (!values.length) return 0;

  return Math.max(...values);
}

function extractLocationText(title = "", snippet = "") {
  const combined = normalizeWhitespace(`${title} ${snippet}`);

  const fullPhrasePatterns = [
    /\b(?:in|at|near)\s+([^.;]+)/i,
    /\b(?:located\s+in|location\s*[:\-]?)\s*([^.;]+)/i
  ];

  for (const pattern of fullPhrasePatterns) {
    const match = combined.match(pattern);
    if (match && match[1]) {
      return normalizeWhitespace(match[1]);
    }
  }

  for (const location of KNOWN_LOCATIONS) {
    const regex = new RegExp(`\\b${location}\\b`, "i");
    if (regex.test(combined)) {
      return location;
    }
  }

  const phraseMatch = combined.match(/\b(?:in|at|near|from)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2})/);
  if (phraseMatch && phraseMatch[1]) {
    return phraseMatch[1].trim();
  }

  return null;
}

function extractPhone(text = "") {
  const phoneMatch = text.match(/\b\d{10}\b/);
  return phoneMatch ? phoneMatch[0] : null;
}

function extractEmail(text = "") {
  const emailMatch = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  return emailMatch ? emailMatch[0] : null;
}

function computeConfidenceScore(parsed) {
  let score = 0;

  if (parsed.title) score += 0.2;
  if (parsed.description && parsed.description.length >= 20) score += 0.2;
  if (parsed.url) score += 0.1;
  if (parsed.category && parsed.category !== "food") score += 0.15;
  if (parsed.urgency === "high") score += 0.1;
  if (parsed.peopleAffected > 0) score += 0.15;
  if (parsed.locationText) score += 0.1;

  return Math.min(1, Number(score.toFixed(2)));
}

function validateSearchResult(result) {
  const title = normalizeWhitespace(result.title || "");
  const description = normalizeWhitespace(result.snippet || result.description || "");

  if (!title || !description) {
    return { valid: false, reason: "Missing title or description" };
  }

  return { valid: true };
}

function parseSearchResult(result) {
  try {
    const title = normalizeWhitespace(result.title || "");
    const description = normalizeWhitespace(result.snippet || result.description || "");
    const url = normalizeWhitespace(result.link || "");

    const validation = validateSearchResult({ title, snippet: description, link: url });
    if (!validation.valid) {
      return { valid: false, reason: validation.reason };
    }

    const searchableText = `${title} ${description}`;
    const inferredCategory = inferCategory(searchableText);
    const inferredUrgency = inferUrgency(searchableText);
    const extractedPhone = extractPhone(searchableText);
    const extractedEmail = extractEmail(searchableText);

    const parsed = {
      title,
      description,
      url,
      category: inferredCategory.value,
      categoryDetected: inferredCategory.detected,
      urgency: inferredUrgency.value,
      urgencyDetected: inferredUrgency.detected,
      peopleAffected: extractPeopleAffected(searchableText),
      locationText: extractLocationText(title, description),
      contact: {
        phone: extractedPhone,
        email: extractedEmail,
        sourceText: description
      }
    };

    parsed.address = parsed.locationText || "";
    parsed.rawAddressText = parsed.locationText || "";

    parsed.confidenceScore = computeConfidenceScore(parsed);

    return {
      valid: true,
      parsed
    };
  } catch (error) {
    const fallbackTitle = normalizeWhitespace(result?.title || "");
    const fallbackDescription = normalizeWhitespace(result?.snippet || result?.description || "");
    const fallbackUrl = normalizeWhitespace(result?.link || "");

    return {
      valid: true,
      parsed: {
        title: fallbackTitle,
        description: fallbackDescription,
        url: fallbackUrl,
        category: "general",
        categoryDetected: false,
        urgency: "low",
        urgencyDetected: false,
        peopleAffected: 0,
        locationText: null,
        address: "",
        rawAddressText: "",
        contact: {
          phone: null,
          email: null,
          sourceText: fallbackDescription
        },
        confidenceScore: 0
      },
      reason: `Parser fallback: ${error.message}`
    };
  }
}

module.exports = {
  parseSearchResult,
  validateSearchResult,
  isValidHttpUrl
};
