/**
 * Admin Controller
 * Handles admin-only operations: viewing all users, enabling/disabling accounts, etc.
 * To be implemented in Phase 2 (Admin Dashboard).
 */

/**
 * @route   GET /api/admin/users
 * @desc    Get all users (with pagination, search, filter)
 * @access  Admin only
 */
const getAllUsers = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin: Get all users — coming in Phase 2.",
  });
};

module.exports = { getAllUsers };