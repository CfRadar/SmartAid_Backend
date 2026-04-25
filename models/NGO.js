const mongoose = require("mongoose");

const { Schema } = mongoose;

const ngoSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      trim: true,
      maxlength: 3000
    },
    contact: {
      phone: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
      },
      website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, "Website must be a valid URL"]
      }
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
      },
      address: String,
      city: String,
      state: String,
      country: String,
      pincode: String
    },
    categories: {
      type: [String],
      default: []
    },
    verification: {
      isVerified: {
        type: Boolean,
        default: false
      },
      documents: {
        type: [String],
        default: []
      }
    },
    stats: {
      totalCampaigns: {
        type: Number,
        min: 0,
        default: 0
      },
      totalPeopleHelped: {
        type: Number,
        min: 0,
        default: 0
      }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

ngoSchema.index({ location: "2dsphere" });
ngoSchema.index({ name: 1 });

module.exports = mongoose.model("NGO", ngoSchema);
