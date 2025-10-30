const express = require("express");
const { body, validationResult, query } = require("express-validator");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Slot = require("../models/Slot");
const { authenticate, authorize, authorizeDoctor } = require("../utils/auth");

const router = express.Router();

// @route   GET /api/doctors
// @desc    Get all doctors with filtering and sorting
// @access  Public
router.get(
  "/",
  [
    query("specialization").optional().isString(),
    query("consultationMode").optional().isIn(["online", "in-person"]),
    query("city").optional().isString(),
    query("minRating").optional().isFloat({ min: 0, max: 5 }),
    query("maxFee").optional().isFloat({ min: 0 }),
    query("sortBy")
      .optional()
      .isIn(["rating", "experience", "consultationFee", "name"]),
    query("sortOrder").optional().isIn(["asc", "desc"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        specialization,
        consultationMode,
        city,
        minRating,
        maxFee,
        sortBy = "rating",
        sortOrder = "desc",
        page = 1,
        limit = 10,
      } = req.query;

      // Build filter query - temporarily remove isVerified filter to show all doctors
      const filterQuery = { isActive: true };

      if (specialization) {
        filterQuery.specialization = specialization;
      }

      if (consultationMode) {
        filterQuery.consultationModes = consultationMode;
      }

      if (city) {
        filterQuery["address.city"] = { $regex: city, $options: "i" };
      }

      if (minRating) {
        filterQuery["rating.average"] = { $gte: parseFloat(minRating) };
      }

      if (maxFee) {
        filterQuery.consultationFee = { $lte: parseFloat(maxFee) };
      }

      // Build sort query
      const sortQuery = {};
      sortQuery[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Execute query
      const doctors = await Doctor.find(filterQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit));

      // Get total count for pagination
      const total = await Doctor.countDocuments(filterQuery);

      res.json({
        doctors,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalDoctors: total,
          hasNextPage: skip + doctors.length < total,
          hasPrevPage: parseInt(page) > 1,
        },
      });
    } catch (error) {
      console.error("Get doctors error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    if (!doctor.isActive) {
      return res.status(404).json({ error: "Doctor not available" });
    }

    res.json({ doctor });
  } catch (error) {
    console.error("Get doctor error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/doctors
// @desc    Create doctor profile
// @access  Private (Doctor only)
router.post(
  "/",
  [
    authenticate,
    authorizeDoctor,
    body("specialization")
      .isIn([
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
      ])
      .withMessage("Invalid specialization"),
    body("experience")
      .isInt({ min: 0 })
      .withMessage("Experience must be a positive number"),
    body("consultationFee")
      .isFloat({ min: 0 })
      .withMessage("Consultation fee must be positive"),
    body("consultationDuration").optional().isInt({ min: 15, max: 120 }),
    body("consultationModes")
      .isArray({ min: 1 })
      .withMessage("At least one consultation mode is required"),
    body("consultationModes.*")
      .isIn(["online", "in-person"])
      .withMessage("Invalid consultation mode"),
    body("languages").optional().isArray({ min: 1 }),
    body("bio")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Bio cannot exceed 1000 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Simplified for now - no userId check
      const doctorData = {
        ...req.body,
      };

      const doctor = new Doctor(doctorData);
      await doctor.save();

      res.status(201).json({
        message: "Doctor profile created successfully",
        doctor,
      });
    } catch (error) {
      console.error("Create doctor error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   PUT /api/doctors/profile
// @desc    Update doctor profile
// @access  Private (Doctor only)
router.put(
  "/profile",
  [
    authenticate,
    authorizeDoctor,
    body("specialization")
      .optional()
      .isIn([
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
      ]),
    body("experience").optional().isInt({ min: 0 }),
    body("consultationFee").optional().isFloat({ min: 0 }),
    body("consultationDuration").optional().isInt({ min: 15, max: 120 }),
    body("consultationModes").optional().isArray({ min: 1 }),
    body("consultationModes.*").optional().isIn(["online", "in-person"]),
    body("languages").optional().isArray({ min: 1 }),
    body("bio").optional().isLength({ max: 1000 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Simplified for now - update any doctor
      const doctor = await Doctor.findByIdAndUpdate(
        req.body.doctorId || req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.json({
        message: "Doctor profile updated successfully",
        doctor,
      });
    } catch (error) {
      console.error("Update doctor error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   PUT /api/doctors/availability
// @desc    Update doctor availability
// @access  Private (Doctor only)
router.put(
  "/availability",
  [
    authenticate,
    authorizeDoctor,
    body("availability").isObject().withMessage("Availability is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { availability } = req.body;

      // Validate availability structure
      const days = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      for (const day of days) {
        if (
          availability[day] &&
          typeof availability[day].isAvailable !== "boolean"
        ) {
          return res
            .status(400)
            .json({ error: `Invalid availability for ${day}` });
        }
      }

      // Simplified for now - update any doctor
      const doctor = await Doctor.findByIdAndUpdate(
        req.body.doctorId || req.params.id,
        { availability },
        { new: true, runValidators: true }
      );

      res.json({
        message: "Availability updated successfully",
        availability: doctor.availability,
      });
    } catch (error) {
      console.error("Update availability error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   GET /api/doctors/:id/availability
// @desc    Get doctor availability for a specific date range
// @access  Public
router.get(
  "/:id/availability",
  [
    query("startDate").isISO8601().withMessage("Start date is required"),
    query("endDate").isISO8601().withMessage("End date is required"),
    query("consultationMode").optional().isIn(["online", "in-person"]),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startDate, endDate, consultationMode } = req.query;
      const doctorId = req.params.id;

      // Check if doctor exists and is active
      const doctor = await Doctor.findById(doctorId);
      if (!doctor || !doctor.isActive) {
        return res.status(404).json({ error: "Doctor not found" });
      }

      // Get available slots
      const slots = await Slot.getAvailableSlots(
        doctorId,
        new Date(startDate),
        consultationMode
      );

      res.json({
        doctor: {
          id: doctor._id,
          specialization: doctor.specialization,
          consultationFee: doctor.consultationFee,
          consultationDuration: doctor.consultationDuration,
        },
        availability: slots,
      });
    } catch (error) {
      console.error("Get availability error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   GET /api/doctors/profile
// @desc    Get current doctor's profile
// @access  Private (Doctor only)
router.get("/profile", authenticate, authorizeDoctor, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor profile not found" });
    }

    res.json({
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        email: req.user.email,
        specialization: doctor.specialization,
        experience: doctor.experience,
        consultationFee: doctor.consultationFee,
        consultationDuration: doctor.consultationDuration,
        languages: doctor.languages,
        consultationModes: doctor.consultationModes,
        rating: doctor.rating,
        totalConsultations: doctor.totalConsultations,
        isActive: doctor.isActive,
        isVerified: doctor.isVerified,
      },
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/doctors/profile
// @desc    Update current doctor's profile
// @access  Private (Doctor only)
router.put(
  "/profile",
  [
    authenticate,
    authorizeDoctor,
    body("specialization")
      .optional()
      .isLength({ min: 2, max: 100 })
      .withMessage("Specialization must be between 2 and 100 characters"),
    body("experience")
      .optional()
      .isInt({ min: 0, max: 50 })
      .withMessage("Experience must be between 0 and 50 years"),
    body("consultationFee")
      .optional()
      .isInt({ min: 100, max: 10000 })
      .withMessage("Consultation fee must be between 100 and 10000"),
    body("consultationDuration")
      .optional()
      .isInt({ min: 15, max: 120 })
      .withMessage("Consultation duration must be between 15 and 120 minutes"),
    body("languages")
      .optional()
      .isArray()
      .withMessage("Languages must be an array"),
    body("consultationModes")
      .optional()
      .isArray()
      .withMessage("Consultation modes must be an array"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }

      // Update fields
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== undefined) {
          doctor[key] = req.body[key];
        }
      });

      await doctor.save();

      res.json({
        message: "Profile updated successfully",
        doctor: {
          _id: doctor._id,
          name: doctor.name,
          specialization: doctor.specialization,
          experience: doctor.experience,
          consultationFee: doctor.consultationFee,
          consultationDuration: doctor.consultationDuration,
          languages: doctor.languages,
          consultationModes: doctor.consultationModes,
        },
      });
    } catch (error) {
      console.error("Update doctor profile error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
