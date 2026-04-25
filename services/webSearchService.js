const axios = require("axios");

const DEFAULT_QUERIES = [
  "food donation India",
  "NGO help needed education",
  "urgent relief work India"
];

async function searchQuery(query) {
  const apiKey = process.env.SERP_API_KEY || process.env.SERPAPI_KEY;
  if (!apiKey) {
    throw new Error("SERP_API_KEY is missing in environment variables");
  }

  const response = await axios.get("https://serpapi.com/search.json", {
    params: {
      engine: "google",
      q: query,
      hl: "en",
      gl: "in",
      api_key: apiKey
    },
    timeout: 15000
  });

  const rawResults = response.data?.organic_results || [];

  return rawResults
    .filter((item) => item?.title && item?.link && item?.snippet)
    .map((item) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }));
}

async function fetchOrganicResults(queries = DEFAULT_QUERIES) {
  const resultsByQuery = await Promise.all(queries.map((query) => searchQuery(query)));
  const flattened = resultsByQuery.flat();

  const uniqueByUrl = new Map();
  for (const item of flattened) {
    if (!item?.link) continue;
    if (!uniqueByUrl.has(item.link)) {
      uniqueByUrl.set(item.link, item);
    }
  }

  return Array.from(uniqueByUrl.values());
}

module.exports = {
  DEFAULT_QUERIES,
  fetchOrganicResults
};
