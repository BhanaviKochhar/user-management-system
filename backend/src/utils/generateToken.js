const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT token for a given user ID.
 * Token expires in 7 days by default.
 *
 * @param {string} userId - MongoDB ObjectId of the user
 * @returns {string} Signed JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

module.exports = generateToken;