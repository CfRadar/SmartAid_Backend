const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    availability: { type: String },
    location: {
      address: { type: String }
    },
    stats: {
      peopleHelped: { type: Number, default: 0 },
      hoursContributed: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
