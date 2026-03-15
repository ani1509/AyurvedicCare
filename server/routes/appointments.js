const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Appointment = require("../models/Appointment");
const Slot = require("../models/Slot");
const Doctor = require("../models/Doctor");
const { authenticate, authorize, authorizeDoctor } = require("../utils/auth");

const router = express.Router();

// @route   POST /api/appointments
// @desc    Create appointment from booked slot
// @access  Private (Patient only)
router.post(
  "/",
  [
    authenticate,
    authorize("patient"),
    body("slotId").isMongoId().withMessage("Valid slot ID is required"),
    body("symptoms")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Symptoms cannot exceed 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { slotId, symptoms } = req.body;

      // Find the booked slot
      const slot = await Slot.findById(slotId);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      // console.log("Slot found:", {
      //   id: slot._id,
      //   status: slot.status,
      //   bookedBy: slot.bookedBy,
      //   userId: req.user._id,
      // });

      if (
        slot.status !== "booked" ||
        slot.bookedBy.userId.toString() !== req.user._id.toString()
      ) {
        // console.log("Slot validation failed:", {
        //   expectedStatus: "booked",
        //   actualStatus: slot.status,
        //   expectedUserId: req.user._id,
        //   actualUserId: slot.bookedBy?.userId,
        // });
        return res.status(400).json({ error: "Slot is not booked by you" });
      }

      // Get doctor details
      const doctor = await Doctor.findById(slot.doctorId);
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }

      // Create appointment
      const appointment = new Appointment({
        patientId: req.user._id,
        doctorId: slot.doctorId,
        slotId: slot._id,
        appointmentDate: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        consultationMode: slot.consultationMode,
        consultationFee: doctor.consultationFee,
        symptoms,
      });

      await appointment.save();

      // Update slot with appointment ID
      slot.appointmentId = appointment._id;
      await slot.save();

      res.status(201).json({
        message: "Appointment created successfully",
        appointment: {
          id: appointment._id,
          doctor: {
            id: doctor._id,
            name: doctor.name,
            specialization: doctor.specialization,
          },
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          consultationMode: appointment.consultationMode,
          consultationFee: appointment.consultationFee,
          status: appointment.status,
        },
      });
    } catch (error) {
      // console.error("Create appointment error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   POST /api/appointments/direct
// @desc    Create appointment directly (for modification purposes)
// @access  Private (Patient only)
router.post(
  "/direct",
  [
    authenticate,
    authorize("patient"),
    body("doctorId").isMongoId().withMessage("Valid doctor ID is required"),
    body("appointmentDate")
      .isISO8601()
      .withMessage("Valid appointment date is required"),
    body("startTime").notEmpty().withMessage("Start time is required"),
    body("endTime").notEmpty().withMessage("End time is required"),
    body("consultationMode")
      .isIn(["in-person", "online"])
      .withMessage("Valid consultation mode is required"),
    body("symptoms")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Symptoms cannot exceed 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        doctorId,
        appointmentDate,
        startTime,
        endTime,
        consultationMode,
        symptoms,
      } = req.body;

      // Check if appointment date is in the future
      const appointmentDateObj = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (appointmentDateObj < today) {
        return res
          .status(400)
          .json({ error: "Appointment date must be in the future" });
      }

      // Get doctor details
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }

      // Create appointment directly
      const appointment = new Appointment({
        patientId: req.user._id,
        doctorId: doctorId,
        appointmentDate: appointmentDate,
        startTime: startTime,
        endTime: endTime,
        consultationMode: consultationMode,
        consultationFee: doctor.consultationFee,
        symptoms: symptoms || "",
        status: "pending",
      });

      await appointment.save();

      res.status(201).json({
        message: "Appointment created successfully",
        appointment: {
          id: appointment._id,
          doctor: {
            id: doctor._id,
            name: doctor.name,
            specialization: doctor.specialization,
          },
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          consultationMode: appointment.consultationMode,
          consultationFee: appointment.consultationFee,
          status: appointment.status,
        },
      });
    } catch (error) {
      // console.error("Create direct appointment error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   GET /api/appointments
// @desc    Get appointments for current user
// @access  Private
router.get(
  "/",
  [
    authenticate,
    query("status")
      .optional()
      .isIn(["pending", "confirmed", "completed", "cancelled", "no-show"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { status, page = 1, limit = 10 } = req.query;

      // Build filter query
      const filterQuery = {};

      if (req.user.role === "patient") {
        filterQuery.patientId = req.user._id;
      } else if (req.user.role === "doctor") {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (doctor) {
          filterQuery.doctorId = doctor._id;
        }
      }

      if (status) {
        filterQuery.status = status;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query
      const appointments = await Appointment.find(filterQuery)
        .populate("patientId", "name email phone")
        .populate("doctorId", "name specialization consultationFee")
        .sort({ appointmentDate: -1, startTime: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await Appointment.countDocuments(filterQuery);

      // console.log("Raw appointments from database:", appointments);
      if (appointments.length > 0) {
        // console.log("First appointment raw data:", appointments[0]);
        // console.log("First appointment doctorId:", appointments[0].doctorId);
      }

      res.json({
        appointments: appointments.map((appointment) => ({
          id: appointment._id,
          patient: appointment.patientId,
          doctor: {
            id: appointment.doctorId._id,
            name: appointment.doctorId.name,
            specialization: appointment.doctorId.specialization,
            consultationFee: appointment.doctorId.consultationFee,
          },
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          consultationMode: appointment.consultationMode,
          status: appointment.status,
          consultationFee: appointment.consultationFee,
          symptoms: appointment.symptoms,
          canBeCancelled: appointment.canBeCancelled(),
          canBeRescheduled: appointment.canBeRescheduled(),
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalAppointments: total,
          hasNextPage: skip + appointments.length < total,
          hasPrevPage: parseInt(page) > 1,
        },
      });
    } catch (error) {
      // console.error("Get appointments error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get("/:id", authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patientId", "name email phone")
      .populate("doctorId", "name specialization consultationFee");

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Check if user is authorized to view this appointment
    if (
      req.user.role === "patient" &&
      appointment.patientId._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this appointment" });
    }

    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (
        !doctor ||
        appointment.doctorId._id.toString() !== doctor._id.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this appointment" });
      }
    }

    res.json({
      appointment: {
        id: appointment._id,
        patient: appointment.patientId,
        doctor: {
          id: appointment.doctorId._id,
          name: appointment.doctorId.name,
          specialization: appointment.doctorId.specialization,
          consultationFee: appointment.doctorId.consultationFee,
        },
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        consultationMode: appointment.consultationMode,
        status: appointment.status,
        consultationFee: appointment.consultationFee,
        symptoms: appointment.symptoms,
        diagnosis: appointment.diagnosis,
        prescription: appointment.prescription,
        notes: appointment.notes,
        rating: appointment.rating,
        canBeCancelled: appointment.canBeCancelled(),
        canBeRescheduled: appointment.canBeRescheduled(),
      },
    });
  } catch (error) {
    // console.error("Get appointment error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel appointment
// @access  Private
router.put(
  "/:id/cancel",
  [
    authenticate,
    body("reason")
      .optional()
      .isLength({ max: 200 })
      .withMessage("Reason cannot exceed 200 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { reason } = req.body;
      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      // Check if user is authorized to cancel this appointment
      if (
        req.user.role === "patient" &&
        appointment.patientId.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Not authorized to cancel this appointment" });
      }

      if (req.user.role === "doctor") {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (
          !doctor ||
          appointment.doctorId.toString() !== doctor._id.toString()
        ) {
          return res
            .status(403)
            .json({ error: "Not authorized to cancel this appointment" });
        }
      }

      // Check if appointment can be cancelled
      if (!appointment.canBeCancelled()) {
        return res
          .status(400)
          .json({
            error:
              "Appointment cannot be cancelled (less than 24 hours before)",
          });
      }

      // Cancel appointment
      appointment.status = "cancelled";
      appointment.cancellationReason = reason;
      appointment.cancelledBy = req.user.role;
      appointment.cancelledAt = new Date();

      await appointment.save();

      // Release the slot
      const slot = await Slot.findById(appointment.slotId);
      if (slot) {
        await slot.releaseSlot();
      }

      res.json({
        message: "Appointment cancelled successfully",
        appointment: {
          id: appointment._id,
          status: appointment.status,
          cancelledAt: appointment.cancelledAt,
        },
      });
    } catch (error) {
      // console.error("Cancel appointment error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   PUT /api/appointments/:id/reschedule
// @desc    Reschedule appointment
// @access  Private (Patient only)
router.put(
  "/:id/reschedule",
  [
    authenticate,
    authorize("patient"),
    body("newSlotId").isMongoId().withMessage("Valid new slot ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { newSlotId } = req.body;
      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      // Check if user owns this appointment
      if (appointment.patientId.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "Not authorized to reschedule this appointment" });
      }

      // Check if appointment can be rescheduled
      if (!appointment.canBeRescheduled()) {
        return res
          .status(400)
          .json({
            error:
              "Appointment cannot be rescheduled (less than 24 hours before)",
          });
      }

      // Find new slot
      const newSlot = await Slot.findById(newSlotId);
      if (!newSlot || newSlot.status !== "available") {
        return res.status(400).json({ error: "New slot is not available" });
      }

      // Check if new slot is for the same doctor
      if (newSlot.doctorId.toString() !== appointment.doctorId.toString()) {
        return res
          .status(400)
          .json({ error: "New slot must be for the same doctor" });
      }

      // Release old slot
      const oldSlot = await Slot.findById(appointment.slotId);
      if (oldSlot) {
        await oldSlot.releaseSlot();
      }

      // Book new slot
      await newSlot.lockSlot(req.user._id, 5);
      await newSlot.bookSlot(req.user._id);

      // Update appointment
      appointment.slotId = newSlot._id;
      appointment.appointmentDate = newSlot.date;
      appointment.startTime = newSlot.startTime;
      appointment.endTime = newSlot.endTime;
      appointment.isRescheduled = true;
      appointment.originalAppointmentId = appointment._id;

      await appointment.save();

      // Update new slot with appointment ID
      newSlot.appointmentId = appointment._id;
      await newSlot.save();

      res.json({
        message: "Appointment rescheduled successfully",
        appointment: {
          id: appointment._id,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          isRescheduled: appointment.isRescheduled,
        },
      });
    } catch (error) {
      // console.error("Reschedule appointment error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   PUT /api/appointments/:id/complete
// @desc    Complete appointment (Doctor only)
// @access  Private (Doctor only)
router.put(
  "/:id/complete",
  [
    authenticate,
    authorizeDoctor,
    body("diagnosis")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Diagnosis cannot exceed 1000 characters"),
    body("prescription")
      .optional()
      .isLength({ max: 2000 })
      .withMessage("Prescription cannot exceed 2000 characters"),
    body("notes")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Notes cannot exceed 1000 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { diagnosis, prescription, notes } = req.body;
      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      // Check if doctor owns this appointment
      if (appointment.doctorId.toString() !== req.doctor._id.toString()) {
        return res
          .status(403)
          .json({ error: "Not authorized to complete this appointment" });
      }

      // Check if appointment is confirmed
      if (appointment.status !== "confirmed") {
        return res
          .status(400)
          .json({ error: "Only confirmed appointments can be completed" });
      }

      // Complete appointment
      appointment.status = "completed";
      if (diagnosis) appointment.diagnosis = diagnosis;
      if (prescription) appointment.prescription = prescription;
      if (notes) appointment.notes = notes;

      await appointment.save();

      // Update doctor's total consultations
      req.doctor.totalConsultations += 1;
      await req.doctor.save();

      res.json({
        message: "Appointment completed successfully",
        appointment: {
          id: appointment._id,
          status: appointment.status,
          diagnosis: appointment.diagnosis,
          prescription: appointment.prescription,
          notes: appointment.notes,
        },
      });
    } catch (error) {
      // console.error("Complete appointment error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   POST /api/appointments/:id/rate
// @desc    Rate appointment (Patient only)
// @access  Private (Patient only)
router.post(
  "/:id/rate",
  [
    authenticate,
    authorize("patient"),
    body("stars")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("review")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Review cannot exceed 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { stars, review } = req.body;
      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }

      // Check if user owns this appointment
      if (appointment.patientId.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "Not authorized to rate this appointment" });
      }

      // Check if appointment is completed
      if (appointment.status !== "completed") {
        return res
          .status(400)
          .json({ error: "Only completed appointments can be rated" });
      }

      // Check if already rated
      if (appointment.rating && appointment.rating.stars) {
        return res.status(400).json({ error: "Appointment already rated" });
      }

      // Add rating
      appointment.rating = {
        stars,
        review,
        createdAt: new Date(),
      };

      await appointment.save();

      // Update doctor's average rating
      const Doctor = require("../models/Doctor");
      const doctor = await Doctor.findById(appointment.doctorId);
      if (doctor) {
        const allRatings = await Appointment.find({
          doctorId: doctor._id,
          "rating.stars": { $exists: true },
        });

        const totalStars = allRatings.reduce(
          (sum, apt) => sum + apt.rating.stars,
          0
        );
        doctor.rating.average = totalStars / allRatings.length;
        doctor.rating.count = allRatings.length;
        await doctor.save();
      }

      res.json({
        message: "Appointment rated successfully",
        rating: appointment.rating,
      });
    } catch (error) {
      // console.error("Rate appointment error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
