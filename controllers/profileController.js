const profileService = require("../services/profileService");

exports.getProfile = async (req, res) => {
  try {
    const profile = await profileService.getProfile(req.user._id);
    res.json(profile);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { skills, interests, availability, location } = req.body;
    const profile = await profileService.updateProfile(req.user._id, { skills, interests, availability, location });
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
