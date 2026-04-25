const mongoose = require("mongoose");

const { Schema } = mongoose;

const availabilitySchema = new Schema(
  {
    days: {
      type: [
        {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday"
          ]
        }
      ],
      default: []
    },
    timeSlots: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    otp: {
      type: String,
      select: false
    },
    otpExpiry: {
      type: Date,
      select: false
    },
    profileCompleted: {
      type: Boolean,
      default: false
    },
    skills: {
      type: [String],
      default: []
    },
    interests: {
      type: [String],
      default: []
    },
    availability: {
      type: availabilitySchema,
      default: () => ({})
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function validateCoordinates(value) {
            if (!value || value.length !== 2) return false;
            const [lng, lat] = value;
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
          },
          message: "Coordinates must be [longitude, latitude]"
        }
      }
    },
    preferences: {
      maxDistance: {
        type: Number,
        min: 1,
        max: 500,
        default: 25
      },
      preferredCategories: {
        type: [String],
        default: []
      },
      urgencyPreference: {
        type: String,
        enum: ["low", "medium", "high", "any"],
        default: "any"
      }
    },
    stats: {
      peopleHelped: {
        type: Number,
        min: 0,
        default: 0
      },
      hoursContributed: {
        type: Number,
        min: 0,
        default: 0
      },
      tasksCompleted: {
        type: Number,
        min: 0,
        default: 0
      },
      impactScore: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    ranking: {
      score: {
        type: Number,
        min: 0,
        default: 0
      },
      level: {
        type: String,
        enum: ["bronze", "silver", "gold", "platinum"],
        default: "bronze"
      }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
