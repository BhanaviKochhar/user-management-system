const User = require("../models/User");

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination, search, and filtering
 * @access  Admin only
 */
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      role = "",
      status = "all",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Search by name or email
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Filter by role
    if (role && ["user", "admin"].includes(role)) {
      filter.role = role;
    }

    // Filter by account status
    if (status === "active") {
      filter.isActive = true;
    } else if (status === "inactive") {
      filter.isActive = false;
    }

    // Get total count and paginated results
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select("-password") // Never return passwords
      .limit(limit * 1)
      .skip(skip)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users.",
    });
  }
};

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get a single user by ID
 * @access  Admin only
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user.",
    });
  }
};

/**
 * @route   PUT /api/admin/users/:id/toggle-status
 * @desc    Enable/disable a user account
 * @access  Admin only
 */
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent admin from disabling themselves
    if (
      user._id.toString() === req.user._id.toString() &&
      user.isActive === true
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot disable your own account.",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account ${user.isActive ? "enabled" : "disabled"}.`,
      user,
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user status.",
    });
  }
};

/**
 * @route   PUT /api/admin/users/:id/change-role
 * @desc    Change user role (user ↔ admin)
 * @access  Admin only
 */
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'user' or 'admin'.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent admin from removing their own admin role
    if (
      user._id.toString() === req.user._id.toString() &&
      role === "user"
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role.",
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role changed from ${oldRole} to ${role}.`,
      user,
    });
  } catch (error) {
    console.error("Change user role error:", error);
    res.status(500).json({
      success: false,
      message: "Error changing user role.",
    });
  }
};

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Permanently delete a user account
 * @access  Admin only
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted permanently.",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user.",
    });
  }
};

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin only
 */
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        adminCount,
        activeUsers,
        inactiveUsers,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching statistics.",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  toggleUserStatus,
  changeUserRole,
  deleteUser,
  getStats,
};