const express = require("express");
const {
  getAllUsers,
  getUserById,
  toggleUserStatus,
  changeUserRole,
  deleteUser,
  getStats,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * Admin Routes
 * Base path: /api/admin
 * All routes require JWT + admin role.
 */

// GET /api/admin/stats — Dashboard stats (users, roles, status counts)
router.get("/stats", protect, restrictTo("admin"), getStats);

// GET /api/admin/users — List all users (with pagination, search, filter)
// Query params: ?page=1&limit=10&search=john&role=user&status=active
router.get("/users", protect, restrictTo("admin"), getAllUsers);

// GET /api/admin/users/:id — Get single user details
router.get("/users/:id", protect, restrictTo("admin"), getUserById);

// PUT /api/admin/users/:id/toggle-status — Enable/disable user account
router.put(
  "/users/:id/toggle-status",
  protect,
  restrictTo("admin"),
  toggleUserStatus
);

// PUT /api/admin/users/:id/change-role — Change user role (user ↔ admin)
router.put(
  "/users/:id/change-role",
  protect,
  restrictTo("admin"),
  changeUserRole
);

// DELETE /api/admin/users/:id — Permanently delete user
router.delete("/users/:id", protect, restrictTo("admin"), deleteUser);

module.exports = router;