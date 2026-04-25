const recommendationService = require("../services/recommendationService");

exports.getRecommendations = async (req, res) => {
  try {
    const recommendations = await recommendationService.getRecommendations(req.user._id);
    res.json(recommendations);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
