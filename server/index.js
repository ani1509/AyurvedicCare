const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const doctorRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");
const slotRoutes = require("./routes/slots");
const { cleanupExpiredSlots } = require("./utils/slotCleanup");
const { markMissedAppointments } = require("./utils/appointmentCleanup");
console.log("MongoDB Atlas integration enabled");

const app = express();
const PORT = 5000;

// Trust proxy for rate limiting
app.set("trust proxy", 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : ["http://localhost:3000"],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/api/health",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Database connection - MongoDB Atlas
mongoose
  .connect(
    "mongodb+srv://ayurvedic_user:ayurvedicpassword@ayurvedic-cluster.r2higbi.mongodb.net/ayurvedic_platform?retryWrites=true&w=majority&appName=ayurvedic-cluster"
  )
  .then(() => console.log("✅ MongoDB Atlas connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes - MongoDB Atlas enabled
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/slots", slotRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Mock API endpoints for frontend testing (commented out to use database)
// The mock route has been removed to prevent conflicts with the database route

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Schedule cleanup of expired slots every 5 minutes
  setInterval(cleanupExpiredSlots, 5 * 60 * 1000);
  console.log("✅ Slot cleanup enabled - running every 5 minutes");

  // Schedule marking missed appointments every 10 minutes
  setInterval(markMissedAppointments, 10 * 60 * 1000);
  console.log(
    "✅ Missed appointment watcher enabled - running every 10 minutes"
  );
});

module.exports = app;
