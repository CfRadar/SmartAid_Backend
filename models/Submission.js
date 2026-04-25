const mongoose = require("mongoose");

const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["form", "web", "import"],
      required: true,
      index: true
    },
    rawData: {
      type: Schema.Types.Mixed,
      required: true
    },
    parsedData: {
      type: Schema.Types.Mixed,
      default: null
    },
    sourceMeta: {
      url: {
        type: String,
        trim: true,
        validate: {
          validator: function validateUrl(v) {
            if (!v) return true;
            return /^https?:\/\/.+/.test(v);
          },
          message: "sourceMeta.url must be a valid URL"
        }
      },
      scrapedAt: Date,
      apiUsed: String
    },
    processingStatus: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
      index: true
    },
    linkedOpportunityId: {
      type: Schema.Types.ObjectId,
      ref: "Opportunity"
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

submissionSchema.index({ type: 1, processingStatus: 1 });

module.exports = mongoose.model("Submission", submissionSchema);
