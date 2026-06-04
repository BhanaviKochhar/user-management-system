const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// ─── Middleware ───────────────────────────────────────────────

// Allow cross-origin requests (frontend ↔ backend communication)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json({ limit: "10mb" })); // 10mb limit for profile image uploads

// ─── Routes ──────────────────────────────────────────────────

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Running...",
  });
});

// Authentication routes (register, login)
app.use("/api/auth", authRoutes);

// User profile routes (protected)
app.use("/api/user", userRoutes);

// Admin routes (protected + admin role)
app.use("/api/admin", adminRoutes);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

module.exports = app;