const mongoose = require("mongoose");

const { Schema } = mongoose;

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["alert", "match", "update"],
      required: true,
      index: true
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    data: {
      type: Schema.Types.Mixed,
      default: {}
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + SIX_HOURS_IN_MS),
      index: { expireAfterSeconds: 0 }
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
