/**
 * Application entry point — Express server with MongoDB.
 */

require("dotenv").config({ override: true });
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const merchantRoutes = require("./routes/merchants");
const storeRoutes = require("./routes/stores");
const productRoutes = require("./routes/products");
const listingRoutes = require("./routes/listings");
const categoryRoutes = require("./routes/categories");
const searchRoutes = require("./routes/search");
const reportRoutes = require("./routes/reports");
const adminRoutes = require("./routes/admin");
const eventRoutes = require("./routes/events");
const healthRoutes = require("./routes/health");

const app = express();
const PORT = process.env.PORT || 8000;

// Trust proxy for Render/Vercel
app.set("trust proxy", 1);

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS - allow frontend on Vercel and local development
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  }),
);

// Body parsing
app.use(express.json({ limit: "10mb" }));

// Request logging (skip health checks)
app.use(
  morgan("short", {
    skip: (req) => req.url === "/api/v1/health" || req.url === "/health",
  }),
);

// Health check on root and api path
app.get("/health", (_req, res) => res.json({ status: "healthy" }));
app.use("/api/v1", healthRoutes);

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/merchants", merchantRoutes);
app.use("/api/v1/stores", storeRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/events", eventRoutes);

// Global error handler (must be after all routes)
app.use((err, _req, res, _next) => {
  console.error("Unhandled exception:", err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: err?.message || "An unexpected error occurred. Please try again.",
    },
  });
});

// Connect to MongoDB and start server
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/rama_product";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(
        `🚀 ${process.env.APP_NAME || "Server"} v${process.env.APP_VERSION || "1.0.0"} running on port ${PORT}`,
      );
      console.log(`   Environment: ${process.env.APP_ENV || "development"}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

module.exports = app;
