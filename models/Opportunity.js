const mongoose = require("mongoose");

const { Schema } = mongoose;

const allowedUrgency = ["low", "medium", "high"];
const allowedStatus = ["open", "ongoing", "completed", "archived"];
const allowedSourceType = ["web", "user", "ngo"];
const allowedCategories = ["food", "education", "medical", "disaster", "general"];
const WEB_EXPIRY_HOURS = 48;

const opportunitySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    category: {
      type: String,
      required: true,
      enum: allowedCategories,
      trim: true,
      index: true
    },
    subCategory: {
      type: String,
      trim: true,
      index: true
    },
    urgency: {
      type: String,
      enum: allowedUrgency,
      default: "medium",
      index: true
    },
    sourceType: {
      type: String,
      enum: allowedSourceType,
      required: true,
      index: true
    },
    sourceDetails: {
      name: {
        type: String,
        trim: true,
        maxlength: 120
      },
      url: {
        type: String,
        trim: true,
        maxlength: 2048,
        validate: {
          validator: function validateUrl(v) {
            if (!v) return true;
            return /^https?:\/\/.+/.test(v);
          },
          message: "sourceDetails.url must be a valid URL"
        }
      },
      externalId: {
        type: String,
        trim: true,
        maxlength: 120
      }
    },
    contentHash: {
      type: String,
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function validateCoordinates(value) {
            if (!value || value.length !== 2) return false;
            const [lng, lat] = value;
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message: "Coordinates must be [longitude, latitude]"
        }
      },
      address: {
        type: String,
        trim: true
      },
      rawText: {
        type: String,
        trim: true
      },
      city: String,
      state: String,
      country: String,
      pincode: String
    },
    contact: {
      name: {
        type: String,
        trim: true,
        maxlength: 120
      },
      phone: {
        type: String,
        trim: true,
        maxlength: 20
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
      },
      sourceText: {
        type: String,
        trim: true,
        maxlength: 4000
      }
    },
    requirements: {
      peopleNeeded: {
        type: Number,
        min: 1,
        default: 1
      },
      skillsRequired: {
        type: [String],
        default: []
      },
      resourcesNeeded: {
        type: [String],
        default: []
      }
    },
    impact: {
      peopleAffected: {
        type: Number,
        min: 0,
        default: 0
      },
      severityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    schedule: {
      startTime: Date,
      endTime: {
        type: Date,
        validate: {
          validator: function validateEndTime(value) {
            if (!value || !this.schedule || !this.schedule.startTime) return true;
            return value >= this.schedule.startTime;
          },
          message: "schedule.endTime must be after startTime"
        }
      },
      isFlexible: {
        type: Boolean,
        default: false
      }
    },
    duration: {
      type: String,
      trim: true,
      maxlength: 200
    },
    media: {
      images: {
        type: [String],
        default: []
      },
      documents: {
        type: [String],
        default: []
      }
    },
    status: {
      type: String,
      enum: allowedStatus,
      default: "open",
      index: true
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true
    },
    verification: {
      isVerified: {
        type: Boolean,
        default: false
      },
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },
      confidenceScore: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
      }
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    tags: {
      type: [String],
      default: []
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    ngoId: {
      type: Schema.Types.ObjectId,
      ref: "NGO"
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

opportunitySchema.index({ location: "2dsphere" });
opportunitySchema.index({ category: 1, urgency: 1, status: 1 });
opportunitySchema.index({ sourceType: 1, "sourceDetails.externalId": 1 });
opportunitySchema.index({ "sourceDetails.url": 1 }, { sparse: true });
opportunitySchema.index({ contentHash: 1 });
opportunitySchema.index({ "location.address": 1 });

opportunitySchema.pre("save", function preSave(next) {
  if (this.status === "completed") {
    this.status = "archived";
  }

  if (this.sourceType === "web" && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + WEB_EXPIRY_HOURS * 60 * 60 * 1000);
  }

  next();
});

opportunitySchema.pre("findOneAndUpdate", function preFindOneAndUpdate(next) {
  const update = this.getUpdate() || {};
  const set = update.$set || {};

  const status = set.status || update.status;
  const sourceType = set.sourceType || update.sourceType;
  const expiresAt = set.expiresAt || update.expiresAt;

  if (status === "completed") {
    set.status = "archived";
  }

  if (sourceType === "web" && !expiresAt) {
    set.expiresAt = new Date(Date.now() + WEB_EXPIRY_HOURS * 60 * 60 * 1000);
  }

  update.$set = set;
  this.setUpdate(update);
  next();
});

module.exports = mongoose.model("Opportunity", opportunitySchema);
