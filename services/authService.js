const User = require("../models/User");
const bcrypt = require("bcrypt");
const axios = require("axios");
const jwt = require("jsonwebtoken");

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function signup(email, password) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  await User.create({
    email,
    password: hashedPassword,
    otp,
    otpExpiry,
    isVerified: false
  });

  if (process.env.URL) {
    try {
      await axios.post(process.env.URL, { email, otp });
    } catch (err) {
      console.warn("Failed to send OTP to Google Script:", err.message);
    }
  }

  return { message: "OTP sent" };
}

async function verifyOtp(email, otp, profileData) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");
  if (user.isVerified) throw new Error("User already verified");
  
  if (user.otp !== otp) throw new Error("Invalid OTP");
  if (user.otpExpiry < new Date()) throw new Error("OTP expired");

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;

  if (profileData.skills) user.skills = profileData.skills;
  if (profileData.interests) user.interests = profileData.interests;
  if (profileData.availability) user.availability = profileData.availability;
  if (profileData.location) user.location = { address: profileData.location };

  await user.save();

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const userData = user.toObject();
  delete userData.password;

  return { token, user: userData };
}

async function login(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid email or password");
  
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid email or password");

  if (!user.isVerified) throw new Error("Please verify your email first");

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { token };
}

module.exports = { signup, verifyOtp, login };
