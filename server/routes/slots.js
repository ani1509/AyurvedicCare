const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Slot = require("../models/Slot");
const Doctor = require("../models/Doctor");
const { authenticate, authorize } = require("../utils/auth");

const router = express.Router();

// @route   POST /api/slots/lock
// @desc    Lock a slot for 5 minutes
// @access  Private (Patient only)
router.post(
  "/lock",
  [
    authenticate,
    authorize("patient"),
    body("slotId").isMongoId().withMessage("Valid slot ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { slotId } = req.body;

      // Find the slot
      const slot = await Slot.findById(slotId);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      // Check if slot is available
      if (slot.status !== "available") {
        return res.status(400).json({ error: "Slot is not available" });
      }

      // Check if slot is in the past
      if (slot.isPast) {
        return res.status(400).json({ error: "Cannot book past slots" });
      }

      // Lock the slot
      await slot.lockSlot(req.user._id, 5); // 5 minutes lock

      res.json({
        message: "Slot locked successfully",
        slot: {
          id: slot._id,
          doctorId: slot.doctorId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          consultationMode: slot.consultationMode,
          status: slot.status,
          expiresAt: slot.lockedBy.expiresAt,
        },
      });
    } catch (error) {
      console.error("Lock slot error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   POST /api/slots/unlock
// @desc    Unlock a slot
// @access  Private (Patient only)
router.post(
  "/unlock",
  [
    authenticate,
    authorize("patient"),
    body("slotId").isMongoId().withMessage("Valid slot ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { slotId } = req.body;

      // Find the slot
      const slot = await Slot.findById(slotId);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      // Check if slot is locked by this user
      if (
        slot.status !== "locked" ||
        slot.lockedBy.userId.toString() !== req.user._id.toString()
      ) {
        return res.status(400).json({ error: "Slot is not locked by you" });
      }

      // Unlock the slot
      await slot.unlockSlot();

      res.json({
        message: "Slot unlocked successfully",
        slot: {
          id: slot._id,
          status: slot.status,
        },
      });
    } catch (error) {
      console.error("Unlock slot error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   POST /api/slots/book
// @desc    Book a locked slot
// @access  Private (Patient only)
router.post(
  "/book",
  [
    authenticate,
    authorize("patient"),
    body("slotId").isMongoId().withMessage("Valid slot ID is required"),
    body("otp").isLength({ min: 4, max: 6 }).withMessage("OTP is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { slotId, otp } = req.body;

      // Find the slot
      const slot = await Slot.findById(slotId);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      // Check if slot is locked by this user
      if (
        slot.status !== "locked" ||
        slot.lockedBy.userId.toString() !== req.user._id.toString()
      ) {
        return res.status(400).json({ error: "Slot is not locked by you" });
      }

      // Check if slot has expired
      if (slot.isExpired) {
        await slot.unlockSlot();
        return res.status(400).json({ error: "Slot lock has expired" });
      }

      // Mock OTP verification (in real app, this would verify against sent OTP)
      const mockOTP = "123456"; // This should be generated and sent to user
      if (otp !== mockOTP) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      // Book the slot
      await slot.bookSlot(req.user._id);

      res.json({
        message: "Slot booked successfully",
        slot: {
          id: slot._id,
          doctorId: slot.doctorId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          consultationMode: slot.consultationMode,
          status: slot.status,
          bookedAt: slot.bookedBy.bookedAt,
        },
      });
    } catch (error) {
      console.error("Book slot error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   POST /api/slots/book-simple
// @desc    Book a locked slot without OTP (simplified for demo)
// @access  Private (Patient only)
router.post(
  "/book-simple",
  [
    authenticate,
    authorize("patient"),
    body("slotId").isMongoId().withMessage("Valid slot ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { slotId } = req.body;

      // Find the slot
      const slot = await Slot.findById(slotId);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      // Check if slot is locked by this user
      if (
        slot.status !== "locked" ||
        slot.lockedBy.userId.toString() !== req.user._id.toString()
      ) {
        console.log("Slot lock validation failed:", {
          expectedStatus: "locked",
          actualStatus: slot.status,
          expectedUserId: req.user._id,
          actualUserId: slot.lockedBy?.userId,
        });
        return res.status(400).json({ error: "Slot is not locked by you" });
      }

      // Check if slot has expired
      if (slot.isExpired) {
        console.log("Slot lock expired, unlocking...");
        await slot.unlockSlot();
        return res.status(400).json({ error: "Slot lock has expired" });
      }

      console.log("Booking slot for user:", req.user._id);

      // Book the slot directly without OTP
      await slot.bookSlot(req.user._id);

      console.log("Slot booked successfully, new status:", slot.status);

      res.json({
        message: "Slot booked successfully",
        slot: {
          id: slot._id,
          doctorId: slot.doctorId,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          consultationMode: slot.consultationMode,
          status: slot.status,
          bookedAt: slot.bookedBy.bookedAt,
        },
      });
    } catch (error) {
      console.error("Book slot simple error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   GET /api/slots/doctor/:doctorId
// @desc    Get available slots for a doctor
// @access  Public
router.get(
  "/doctor/:doctorId",
  [
    query("date").isISO8601().withMessage("Date is required"),
    query("consultationMode").optional().isIn(["online", "in-person"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { doctorId } = req.params;
      const { date, consultationMode } = req.query;

      // Check if doctor exists and is active
      const doctor = await Doctor.findById(doctorId);
      if (!doctor || !doctor.isActive || !doctor.isVerified) {
        return res.status(404).json({ error: "Doctor not found" });
      }

      // Get available slots
      const slots = await Slot.getAvailableSlots(
        doctorId,
        new Date(date),
        consultationMode
      );

      res.json({
        doctor: {
          id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          consultationFee: doctor.consultationFee,
          consultationDuration: doctor.consultationDuration,
        },
        slots: slots.map((slot) => ({
          id: slot._id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          consultationMode: slot.consultationMode,
          status: slot.status,
        })),
      });
    } catch (error) {
      console.error("Get slots error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   GET /api/slots/my-locked
// @desc    Get slots locked by current user
// @access  Private (Patient only)
router.get(
  "/my-locked",
  authenticate,
  authorize("patient"),
  async (req, res) => {
    try {
      const slots = await Slot.find({
        "lockedBy.userId": req.user._id,
        status: "locked",
      }).populate("doctorId", "name specialization consultationFee");

      res.json({
        slots: slots.map((slot) => ({
          id: slot._id,
          doctor: {
            id: slot.doctorId._id,
            name: slot.doctorId.name,
            specialization: slot.doctorId.specialization,
            consultationFee: slot.doctorId.consultationFee,
          },
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          consultationMode: slot.consultationMode,
          lockedAt: slot.lockedBy.lockedAt,
          expiresAt: slot.lockedBy.expiresAt,
        })),
      });
    } catch (error) {
      console.error("Get locked slots error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   DELETE /api/slots/:id
// @desc    Delete a slot (Admin/Doctor only)
// @access  Private (Doctor/Admin only)
router.delete(
  "/:id",
  [authenticate, authorize("doctor", "admin")],
  async (req, res) => {
    try {
      const slot = await Slot.findById(req.params.id);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }

      // Check if user is authorized to delete this slot
      if (req.user.role === "doctor") {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (!doctor || slot.doctorId.toString() !== doctor._id.toString()) {
          return res
            .status(403)
            .json({ error: "Not authorized to delete this slot" });
        }
      }

      // Check if slot is booked
      if (slot.status === "booked") {
        return res.status(400).json({ error: "Cannot delete a booked slot" });
      }

      await Slot.findByIdAndDelete(req.params.id);

      res.json({ message: "Slot deleted successfully" });
    } catch (error) {
      console.error("Delete slot error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   POST /api/slots/create
// @desc    Create slots for a doctor (Admin/Doctor only)
// @access  Private (Doctor/Admin only)
router.post(
  "/create",
  [
    authenticate,
    authorize("doctor", "admin"),
    body("doctorId").isMongoId().withMessage("Valid doctor ID is required"),
    body("date").isISO8601().withMessage("Valid date is required"),
    body("slots")
      .isArray({ min: 1 })
      .withMessage("At least one slot is required"),
    body("slots.*.startTime")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Invalid start time format"),
    body("slots.*.endTime")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Invalid end time format"),
    body("consultationMode")
      .isIn(["online", "in-person"])
      .withMessage("Invalid consultation mode"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { doctorId, date, slots, consultationMode } = req.body;

      // Check if doctor exists
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }

      // Check if user is authorized to create slots for this doctor
      if (
        req.user.role === "doctor" &&
        doctor.userId.toString() !== req.user._id.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Not authorized to create slots for this doctor" });
      }

      // Create slots
      const createdSlots = await Slot.createSlotsForDoctor(
        doctorId,
        new Date(date),
        slots,
        consultationMode
      );

      res.status(201).json({
        message: "Slots created successfully",
        slots: createdSlots.map((slot) => ({
          id: slot._id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          consultationMode: slot.consultationMode,
          status: slot.status,
        })),
      });
    } catch (error) {
      console.error("Create slots error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   POST /api/slots/generate-for-patient
// @desc    Generate slots for a doctor on a specific date (for patient booking)
// @access  Private (Patient only)
router.post(
  "/generate-for-patient",
  [
    authenticate,
    authorize("patient"),
    body("doctorId").isMongoId().withMessage("Valid doctor ID is required"),
    body("date").isISO8601().withMessage("Valid date is required"),
    body("consultationMode")
      .isIn(["online", "in-person"])
      .withMessage("Invalid consultation mode"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { doctorId, date, consultationMode } = req.body;

      console.log("Received request:", {
        doctorId,
        date,
        consultationMode,
        dateType: typeof date,
      });

      // Check if doctor exists and is active
      const doctor = await Doctor.findById(doctorId);
      if (!doctor || !doctor.isActive || !doctor.isVerified) {
        return res
          .status(404)
          .json({ error: "Doctor not found or not available" });
      }

      // Check if slots already exist for this date and consultation mode
      const searchDate = new Date(date);
      console.log("Searching for slots with date:", searchDate);

      const existingSlots = await Slot.find({
        doctorId,
        date: searchDate,
        consultationMode,
      });
      console.log("Found existing slots:", existingSlots.length);

      if (existingSlots.length > 0) {
        // Return existing slots
        return res.json({
          message: "Slots already exist",
          slots: existingSlots.map((slot) => ({
            id: slot._id,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            consultationMode: slot.consultationMode,
            status: slot.status,
          })),
        });
      }

      // Generate default slots (9 AM to 6 PM, 30-minute intervals)
      const slots = [];
      const startHour = 9;
      const endHour = 18;

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startTime = `${hour.toString().padStart(2, "0")}:${minute
            .toString()
            .padStart(2, "0")}`;
          const endHour = minute === 30 ? hour + 1 : hour;
          const endMinute = minute === 30 ? 0 : 30;
          const endTime = `${endHour.toString().padStart(2, "0")}:${endMinute
            .toString()
            .padStart(2, "0")}`;

          slots.push({
            startTime,
            endTime,
          });
        }
      }

      // Create slots in database
      console.log(
        "Creating slots for doctor:",
        doctorId,
        "date:",
        date,
        "mode:",
        consultationMode
      );
      const createdSlots = await Slot.createSlotsForDoctor(
        doctorId,
        new Date(date),
        slots,
        consultationMode
      );
      console.log("Created slots:", createdSlots.length, "slots");

      res.status(201).json({
        message: "Slots generated successfully",
        slots: createdSlots.map((slot) => ({
          id: slot._id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          consultationMode: slot.consultationMode,
          status: slot.status,
        })),
      });
    } catch (error) {
      console.error("Generate slots error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
