/**
 * Middleware: Restrict to Roles
 * Must be used AFTER the `protect` middleware (req.user must exist).
 *
 * Usage: router.get("/admin/users", protect, restrictTo("admin"), getAllUsers)
 *
 * @param  {...string} roles - Allowed roles (e.g., "admin", "user")
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }
    next();
  };
};

module.exports = { restrictTo };