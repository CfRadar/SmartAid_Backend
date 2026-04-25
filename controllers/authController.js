const authService = require("../services/authService");

exports.signup = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const result = await authService.signup(email, password);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, skills, interests, availability, location } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });
    if (!skills || !interests || !availability || !location) {
        return res.status(400).json({ error: "Profile fields required" });
    }
    const result = await authService.verifyOtp(email, otp, { skills, interests, availability, location });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
