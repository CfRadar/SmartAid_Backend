const User = require("../models/User");
const bcrypt = require("bcrypt");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const DEV_OTP = "198920";

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function signup(email, password) {
  const existing = await User.findOne({ email });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  if (existing) {
    if (existing.isVerified) {
      throw new Error("User already exists, please login");
    } else {
      existing.password = hashedPassword;
      existing.otp = otp;
      existing.otpExpiry = otpExpiry;
      await existing.save();

      if (process.env.URL) {
        try {
          await axios.post(process.env.URL, { email, otp });
        } catch (err) {
          console.warn("Failed to send OTP to Google Script:", err.message);
        }
      }

      return { message: "OTP resent" };
    }
  }

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

async function verifyOtp(email, otp) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");
  if (user.isVerified) throw new Error("User already verified");

  const enteredOtp = String(otp).trim();
  const nodeEnv = (process.env.NODE_ENV || "").toLowerCase();
  const isDevBypass = nodeEnv === "development" && enteredOtp === DEV_OTP;

  if (!isDevBypass) {
    if (user.otp !== enteredOtp) throw new Error("Invalid OTP");
    if (user.otpExpiry < new Date()) throw new Error("OTP expired");
  } else {
    console.log("DEV OTP USED");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;

  await user.save();

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      email: user.email,
      isVerified: user.isVerified,
      profileCompleted: user.profileCompleted
    }
  };
}

async function login(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid email or password");

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error("Invalid email or password");

  if (!user.isVerified) {
    const error = new Error("Please verify your account first");
    error.needsVerification = true;
    throw error;
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      email: user.email,
      profileCompleted: user.profileCompleted
    }
  };
}

module.exports = { signup, verifyOtp, login };
