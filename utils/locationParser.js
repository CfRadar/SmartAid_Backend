function parseLocation(text) {
  if (!text) return { type: "Point", coordinates: [0, 0], address: "Not specified" };
  
  let extracted = text;
  const match = text.match(/\b(?:in|at)\s+([A-Z][a-zA-Z\s]+)/i);
  if (match && match[1]) {
    extracted = match[1].trim();
  }

  return {
    type: "Point",
    coordinates: [0, 0],
    address: extracted
  };
}

module.exports = { parseLocation };
