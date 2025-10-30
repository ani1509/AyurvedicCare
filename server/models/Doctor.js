const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    // Add name field for the doctor
    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    // userId field removed to simplify the model
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      enum: [
        "General Ayurveda",
        "Panchakarma",
        "Rasayana",
        "Kayachikitsa",
        "Shalya Tantra",
        "Shalakya Tantra",
        "Prasuti Tantra",
        "Kaumara Bhritya",
        "Agada Tantra",
        "Vajikarana",
      ],
    },
    qualifications: [
      {
        degree: {
          type: String,
          required: true,
        },
        institution: String,
        year: Number,
      },
    ],
    experience: {
      type: Number,
      required: [true, "Years of experience is required"],
      min: [0, "Experience cannot be negative"],
    },
    consultationFee: {
      type: Number,
      required: [true, "Consultation fee is required"],
      min: [0, "Fee cannot be negative"],
    },
    consultationDuration: {
      type: Number,
      default: 30, // minutes
      min: [15, "Minimum consultation duration is 15 minutes"],
      max: [120, "Maximum consultation duration is 120 minutes"],
    },
    consultationModes: [
      {
        type: String,
        enum: ["online", "in-person"],
        required: true,
      },
    ],
    languages: [
      {
        type: String,
        required: false,
        default: ["English", "Hindi"],
      },
    ],
    bio: {
      type: String,
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: "India",
      },
    },
    availability: {
      monday: {
        isAvailable: { type: Boolean, default: false },
        slots: [
          {
            startTime: String,
            endTime: String,
          },
        ],
      },
      tuesday: {
        isAvailable: { type: Boolean, default: false },
        slots: [
          {
            startTime: String,
            endTime: String,
          },
        ],
      },
      wednesday: {
        isAvailable: { type: Boolean, default: false },
        slots: [
          {
            startTime: String,
            endTime: String,
          },
        ],
      },
      thursday: {
        isAvailable: { type: Boolean, default: false },
        slots: [
          {
            startTime: String,
            endTime: String,
          },
        ],
      },
      friday: {
        isAvailable: { type: Boolean, default: false },
        slots: [
          {
            startTime: String,
            endTime: String,
          },
        ],
      },
      saturday: {
        isAvailable: { type: Boolean, default: false },
        slots: [
          {
            startTime: String,
            endTime: String,
          },
        ],
      },
      sunday: {
        isAvailable: { type: Boolean, default: false },
        slots: [
          {
            startTime: String,
            endTime: String,
          },
        ],
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    totalConsultations: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
doctorSchema.index({ specialization: 1, isActive: 1 });
doctorSchema.index({ "availability.monday.isAvailable": 1 });
doctorSchema.index({ rating: -1 });
doctorSchema.index({ consultationFee: 1 });

// Virtual for full address
doctorSchema.virtual("fullAddress").get(function () {
  const addr = this.address;
  return `${addr.street}, ${addr.city}, ${addr.state} ${addr.pincode}, ${addr.country}`;
});

// Method to check if doctor is available on a specific day and time
doctorSchema.methods.isAvailableAt = function (day, time) {
  const daySchedule = this.availability[day.toLowerCase()];
  if (!daySchedule || !daySchedule.isAvailable) return false;

  return daySchedule.slots.some((slot) => {
    return time >= slot.startTime && time <= slot.endTime;
  });
};

module.exports = mongoose.model("Doctor", doctorSchema);
