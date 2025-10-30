const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ error: "Invalid token. User not found." });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Account is deactivated." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token." });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Insufficient permissions." });
    }

    next();
  };
};

// Doctor-specific authorization
const authorizeDoctor = async (req, res, next) => {
  try {
    if (req.user.role !== "doctor") {
      return res
        .status(403)
        .json({ error: "Access denied. Doctor role required." });
    }

    // Check if doctor profile exists and is verified
    const Doctor = require("../models/Doctor");
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(403).json({ error: "Doctor profile not found." });
    }

    if (!doctor.isVerified) {
      return res.status(403).json({ error: "Doctor profile not verified." });
    }

    req.doctor = doctor;
    next();
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  authorizeDoctor,
};
