const express = require("express");
const { getAllUsers } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * Admin Routes
 * Base path: /api/admin
 * All routes require JWT + admin role.
 */

// GET /api/admin/users — Get all users (Phase 2)
router.get("/users", protect, restrictTo("admin"), getAllUsers);

module.exports = router;