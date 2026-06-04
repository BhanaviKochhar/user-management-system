const User = require("../models/User");

/**
 * @route   GET /api/user/profile
 * @desc    Get the logged-in user's profile
 * @access  Private (requires JWT)
 */
const getProfile = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id);

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
    console.error("Get Profile Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile.",
    });
  }
};

/**
 * @route   PUT /api/user/profile
 * @desc    Update the logged-in user's profile
 * @access  Private (requires JWT)
 */
const updateProfile = async (req, res) => {
  try {
    // Fields the user is NOT allowed to update themselves
    const restricted = ["role", "isActive", "password"];
    restricted.forEach((field) => delete req.body[field]);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: req.body },
      { new: true, runValidators: true } // Return updated doc, run schema validation
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating profile.",
    });
  }
};

/**
 * @route   PUT /api/user/change-password
 * @desc    Change the logged-in user's password
 * @access  Private (requires JWT)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    // Fetch user with password field (hidden by default)
    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword; // Pre-save hook will hash it
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change Password Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while changing password.",
    });
  }
};

module.exports = { getProfile, updateProfile, changePassword };