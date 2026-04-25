const Opportunity = require("../models/Opportunity");

async function getDashboardStats() {
  const [
    totalIssues,
    activeOpportunities,
    peopleAgg,
    recentActivities
  ] = await Promise.all([
    Opportunity.countDocuments({}),
    Opportunity.countDocuments({ status: "open" }),
    Opportunity.aggregate([
      {
        $group: {
          _id: null,
          totalPeopleAffected: { $sum: "$impact.peopleAffected" }
        }
      }
    ]),
    Opportunity.find({}).sort({ createdAt: -1 }).limit(5)
  ]);

  return {
    totalIssues,
    totalPeopleAffected: peopleAgg[0]?.totalPeopleAffected || 0,
    activeOpportunities,
    recentActivities
  };
}

module.exports = {
  getDashboardStats
};
