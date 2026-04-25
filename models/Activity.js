const mongoose = require("mongoose");

const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: "Opportunity",
      required: true,
      index: true
    },
    action: {
      type: String,
      enum: ["joined", "completed", "viewed"],
      required: true,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

activitySchema.index({ userId: 1, opportunityId: 1, action: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);
