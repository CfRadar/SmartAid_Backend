function detectCategory(description) {
  if (!description) return "general";
  const desc = description.toLowerCase();
  
  if (desc.includes("food") || desc.includes("hunger") || desc.includes("meal")) return "food";
  if (desc.includes("school") || desc.includes("book") || desc.includes("education")) return "education";
  if (desc.includes("hospital") || desc.includes("medicine") || desc.includes("medical")) return "medical";
  if (desc.includes("flood") || desc.includes("earthquake") || desc.includes("disaster")) return "disaster";
  
  return "general";
}

module.exports = { detectCategory };
