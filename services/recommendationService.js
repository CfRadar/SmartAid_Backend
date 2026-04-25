const Opportunity = require("../models/Opportunity");
const User = require("../models/User");

async function getRecommendations(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const opportunities = await Opportunity.find({ status: "open" });
  
  const userSkills = user.skills || [];
  const userInterests = user.interests || [];

  const scoredOpps = opportunities.map(opp => {
    let score = 0;
    const cat = opp.category || "general";
    
    if (userInterests.includes(cat)) score += 2;
    if (userSkills.includes(cat)) score += 1;

    return { opportunity: opp, score };
  });

  scoredOpps.sort((a, b) => b.score - a.score);
  return scoredOpps.slice(0, 5).map(item => item.opportunity);
}

module.exports = { getRecommendations };
