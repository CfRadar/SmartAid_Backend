const User = require("../models/User");

exports.getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ rankingScore: -1 })
      .limit(10)
      .select("email rankingScore stats location");
    res.json(topUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
