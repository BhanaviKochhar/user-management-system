const express = require("express");
const {
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * User Routes
 * Base path: /api/user
 * All routes are protected — valid JWT required.
 */

// GET  /api/user/profile        — Fetch logged-in user's profile
// PUT  /api/user/profile        — Update logged-in user's profile
router
  .route("/profile")
  .get(protect, getProfile)
  .put(protect, updateProfile);

// PUT /api/user/change-password — Change password
router.put("/change-password", protect, changePassword);

module.exports = router;