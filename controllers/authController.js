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
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });
    const result = await authService.verifyOtp(email, otp);
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
    const errorResponse = { error: err.message };
    if (err.needsVerification) {
      errorResponse.needsVerification = true;
    }
    res.status(401).json(errorResponse);
  }
};
