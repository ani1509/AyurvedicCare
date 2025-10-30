const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Slot",
      required: false,
    },
    appointmentDate: {
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
      enum: ["pending", "confirmed", "completed", "cancelled", "no-show"],
      default: "pending",
    },
    consultationFee: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    symptoms: {
      type: String,
      maxlength: [500, "Symptoms description cannot exceed 500 characters"],
    },
    diagnosis: {
      type: String,
      maxlength: [1000, "Diagnosis cannot exceed 1000 characters"],
    },
    prescription: {
      type: String,
      maxlength: [2000, "Prescription cannot exceed 2000 characters"],
    },
    notes: {
      type: String,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    rating: {
      stars: {
        type: Number,
        min: 1,
        max: 5,
      },
      review: {
        type: String,
        maxlength: [500, "Review cannot exceed 500 characters"],
      },
      createdAt: Date,
    },
    cancellationReason: {
      type: String,
      maxlength: [200, "Cancellation reason cannot exceed 200 characters"],
    },
    cancelledBy: {
      type: String,
      enum: ["patient", "doctor", "system"],
    },
    cancelledAt: Date,
    meetingLink: {
      type: String,
    },
    isRescheduled: {
      type: Boolean,
      default: false,
    },
    originalAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1, startTime: 1 });
appointmentSchema.index({ paymentStatus: 1 });

// Virtual for appointment duration
appointmentSchema.virtual("duration").get(function () {
  const start = new Date(`2000-01-01T${this.startTime}`);
  const end = new Date(`2000-01-01T${this.endTime}`);
  return Math.round((end - start) / (1000 * 60)); // duration in minutes
});

// Virtual for isUpcoming
appointmentSchema.virtual("isUpcoming").get(function () {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  appointmentDateTime.setHours(parseInt(this.startTime.split(":")[0]));
  appointmentDateTime.setMinutes(parseInt(this.startTime.split(":")[1]));

  return appointmentDateTime > now && this.status === "confirmed";
});

// Virtual for isPast
appointmentSchema.virtual("isPast").get(function () {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  appointmentDateTime.setHours(parseInt(this.endTime.split(":")[0]));
  appointmentDateTime.setMinutes(parseInt(this.endTime.split(":")[1]));

  return appointmentDateTime < now;
});

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function () {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  appointmentDateTime.setHours(parseInt(this.startTime.split(":")[0]));
  appointmentDateTime.setMinutes(parseInt(this.startTime.split(":")[1]));

  const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);

  return (
    hoursUntilAppointment > 24 && ["pending", "confirmed"].includes(this.status)
  );
};

// Method to check if appointment can be rescheduled
appointmentSchema.methods.canBeRescheduled = function () {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  appointmentDateTime.setHours(parseInt(this.startTime.split(":")[0]));
  appointmentDateTime.setMinutes(parseInt(this.startTime.split(":")[1]));

  const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);

  return (
    hoursUntilAppointment > 24 && ["pending", "confirmed"].includes(this.status)
  );
};

module.exports = mongoose.model("Appointment", appointmentSchema);
