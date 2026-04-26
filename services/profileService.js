const User = require("../models/User");

async function getProfile(userId) {
  const user = await User.findById(userId).select("-password -otp -otpExpiry");
  if (!user) throw new Error("User not found");
  return user;
}

/**
 * First-time profile setup — marks profileCompleted = true
 */
async function setupProfile(userId, profileData) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (profileData.skills !== undefined) user.skills = profileData.skills;
  if (profileData.interests !== undefined) user.interests = profileData.interests;
  if (profileData.availability !== undefined) user.availability = profileData.availability;
  if (profileData.location?.address !== undefined) {
    user.location = { address: profileData.location.address };
  }

  user.profileCompleted = true;

  await user.save();

  const result = user.toObject();
  delete result.password;
  delete result.otp;
  delete result.otpExpiry;
  return result;
}

/**
 * General profile update (no profileCompleted side-effect)
 */
async function updateProfile(userId, profileData) {
  const user = await User.findById(userId).select("-password -otp -otpExpiry");
  if (!user) throw new Error("User not found");

  if (profileData.skills !== undefined) user.skills = profileData.skills;
  if (profileData.interests !== undefined) user.interests = profileData.interests;
  if (profileData.availability !== undefined) user.availability = profileData.availability;
  if (profileData.location?.address !== undefined) {
    user.location = { address: profileData.location.address };
  }

  await user.save();
  return user;
}

module.exports = { getProfile, setupProfile, updateProfile };
