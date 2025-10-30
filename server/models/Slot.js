const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    consultationMode: {
      type: String,
      enum: ["online", "in-person"],
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "locked", "booked", "cancelled"],
      default: "available",
    },
    lockedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      lockedAt: Date,
      expiresAt: Date,
    },
    bookedBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      bookedAt: Date,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
      },
      endDate: Date,
      daysOfWeek: [
        {
          type: String,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
slotSchema.index({ doctorId: 1, date: 1, startTime: 1 });
slotSchema.index({ status: 1, date: 1 });
slotSchema.index({ "lockedBy.expiresAt": 1 });
slotSchema.index({ date: 1, startTime: 1, status: 1 });

// Virtual for slot duration
slotSchema.virtual("duration").get(function () {
  const start = new Date(`2000-01-01T${this.startTime}`);
  const end = new Date(`2000-01-01T${this.endTime}`);
  return Math.round((end - start) / (1000 * 60)); // duration in minutes
});

// Virtual for isPast
slotSchema.virtual("isPast").get(function () {
  const now = new Date();
  const slotDateTime = new Date(this.date);
  slotDateTime.setHours(parseInt(this.startTime.split(":")[0]));
  slotDateTime.setMinutes(parseInt(this.startTime.split(":")[1]));

  return slotDateTime < now;
});

// Virtual for isExpired (for locked slots)
slotSchema.virtual("isExpired").get(function () {
  if (this.status !== "locked" || !this.lockedBy || !this.lockedBy.expiresAt) {
    return false;
  }

  const now = new Date();
  return now > this.lockedBy.expiresAt;
});

// Method to lock slot for a user
slotSchema.methods.lockSlot = function (userId, lockDuration = 5) {
  if (this.status !== "available") {
    throw new Error("Slot is not available for locking");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + lockDuration * 60 * 1000); // lockDuration in minutes

  this.status = "locked";
  this.lockedBy = {
    userId: userId,
    lockedAt: now,
    expiresAt: expiresAt,
  };

  return this.save();
};

// Method to unlock slot
slotSchema.methods.unlockSlot = function () {
  if (this.status === "locked") {
    this.status = "available";
    this.lockedBy = undefined;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to book slot
slotSchema.methods.bookSlot = function (userId) {
  if (this.status !== "locked" || this.isExpired) {
    throw new Error("Slot is not available for booking");
  }

  if (this.lockedBy.userId.toString() !== userId.toString()) {
    throw new Error("Slot is locked by another user");
  }

  this.status = "booked";
  this.bookedBy = {
    userId: userId,
    bookedAt: new Date(),
  };

  return this.save();
};

// Method to release slot
slotSchema.methods.releaseSlot = function () {
  if (this.status === "booked") {
    this.status = "available";
    this.bookedBy = undefined;
    this.appointmentId = undefined;
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to create slots for a doctor
slotSchema.statics.createSlotsForDoctor = async function (
  doctorId,
  date,
  slots,
  consultationMode
) {
  const slotDocuments = slots.map((slot) => ({
    doctorId,
    date,
    startTime: slot.startTime,
    endTime: slot.endTime,
    consultationMode,
    status: "available", // Ensure slots start as available
  }));

  return await this.insertMany(slotDocuments);
};

// Static method to get available slots for a doctor on a date
slotSchema.statics.getAvailableSlots = async function (
  doctorId,
  date,
  consultationMode
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  console.log("Searching for slots between:", startOfDay, "and", endOfDay);

  const slots = await this.find({
    doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    consultationMode,
    status: "available",
  }).sort({ startTime: 1 });

  console.log("Found slots:", slots.length);
  return slots;
};

module.exports = mongoose.model("Slot", slotSchema);
