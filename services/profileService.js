const User = require("../models/User");

async function getProfile(userId) {
  const user = await User.findById(userId).select("-password -otp -otpExpiry");
  if (!user) throw new Error("User not found");
  return user;
}

async function updateProfile(userId, profileData) {
  const user = await User.findById(userId).select("-password -otp -otpExpiry");
  if (!user) throw new Error("User not found");

  if (profileData.skills) user.skills = profileData.skills;
  if (profileData.interests) user.interests = profileData.interests;
  if (profileData.availability) user.availability = profileData.availability;
  if (profileData.location) user.location = { address: profileData.location };

  await user.save();
  return user;
}

module.exports = { getProfile, updateProfile };
